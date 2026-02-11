import { Injectable, Logger } from '@nestjs/common';
import {
  HotelTemplateEmail,
  HotelTemplateEmailCodeEnum
} from '@src/core/entities/hotel-entities/hotel-template-email.entity';
import {
  EmailTranslationInput,
  HotelTemplateEmailFilterDto,
  HotelTemplateEmailResponseDto,
  UpdateEmailContentInput,
  UpdateEmailTranslationInput
} from '../dtos/hotel-template-emai.dto';
import { HotelTemplateEmailRepository } from '../repositories/hotel-template-email.repository';
import { ResponseContentStatusEnum } from '@src/core/dtos/common.dto';
import { LanguageCodeEnum } from '@src/core/enums/common';
import { TranslationStaticContentRepository } from '@src/modules/translation';
import { TranslationDynamicContentRepository } from '@src/modules/translation/repositories/translation-dynamic-content.repository';
import { TranslationHotelLanguageBundleRepository } from '@src/modules/translation/repositories/translation-hotel-language-bundle.repository';
import { TranslationEntityConfigRepository } from '@src/modules/translation/repositories/translation-entity-config.repository';
import { EntityTranslationConfigCodeEnum } from '@src/core/entities/translation-entities/translation-entity-config.entity';
export interface HotelTemplateEmailDto {
  id: string;
  hotelId: string;
  code: string;
  name: string;
  languageCode: string;
  templateId: string;
  openingSection?: string;
  openingSectionForReturningGuest?: string;
  closingSection?: string;
  signature?: string;
  isDefault: boolean;
  title?: string;
  isEnable: boolean;
  subject?: string;
  senderName?: string;
  senderEmail?: string;
}

@Injectable()
export class HotelTemplateEmailService {
  private readonly logger = new Logger(HotelTemplateEmailService.name);

  constructor(
    private readonly translationDynamicContentRepository: TranslationDynamicContentRepository,
    private readonly translationStaticContentRepository: TranslationStaticContentRepository,
    private readonly translationHotelLanguageBundleRepository: TranslationHotelLanguageBundleRepository,
    private readonly translationEntityConfigRepository: TranslationEntityConfigRepository,
    private readonly hotelTemplateEmailRepository: HotelTemplateEmailRepository
  ) {}

  async getHotelTemplateEmail(
    hotelId: string,
    code: string,
    languageCode?: string
  ): Promise<HotelTemplateEmailDto | null> {
    try {
      this.logger.log(
        `[getHotelTemplateEmail] Getting template ${code} for hotel ${hotelId} in language ${languageCode}`
      );

      const filter: HotelTemplateEmailFilterDto = {
        hotelId,
        code,
        languageCode: languageCode || LanguageCodeEnum.EN
      };

      const templateEmail = await this.hotelTemplateEmailRepository.getHotelTemplateEmail(filter);

      if (!templateEmail) {
        this.logger.warn(
          `[getHotelTemplateEmail] No template found for hotel ${hotelId}, code ${code}, language ${languageCode}`
        );
        return null;
      }

      return this.transformToDto(templateEmail);
    } catch (error) {
      this.logger.error(`[getHotelTemplateEmail] Error: ${error.message}`);
      throw error;
    }
  }

  async getHotelTemplateEmails(filter: HotelTemplateEmailFilterDto) {
    try {
      const { codes } = filter;
      if (!codes?.length) {
        filter.codes = [
          HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION,
          HotelTemplateEmailCodeEnum.CPP_PROPOSAL_BOOKING_CONFIRMATION,
          HotelTemplateEmailCodeEnum.CPP_VERIFY_BOOKING_CONFIRMATION,
          HotelTemplateEmailCodeEnum.RELEASED_EMAIL,
          HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION
        ];
      }
      filter.languageCode = filter.languageCode || LanguageCodeEnum.EN;

      const templateEmails = await this.hotelTemplateEmailRepository.getHotelTemplateEmails(filter);
      const mapData = templateEmails?.map((template) => {
        const a: HotelTemplateEmailResponseDto = {
          id: template.id,
          titleDynamicFieldList: this.getAvailableDynamicFieldList(template.code as any),
          code: template.code,
          title: template.title,
          openingSection: template.openingSection,
          openingSectionDynamicFieldList: this.getAvailableDynamicFieldList(template.code as any),
          closingSection: template.closingSection,
          closingSectionDynamicFieldList: this.getAvailableDynamicFieldList(template.code as any),
          signature: template.signature,
          isEnable: template.isEnable
        };
        return a;
      });

      return mapData;
    } catch (error) {
      this.logger.error(`[getHotelTemplateEmails] Error: ${error.message}`);
      throw error;
    }
  }

  async updateEmailContent(input: UpdateEmailContentInput) {
    await this.hotelTemplateEmailRepository.updateEmailContent(input);
    return {
      status: ResponseContentStatusEnum.SUCCESS,
      data: true,
      message: 'Email content updated successfully'
    };
  }

  async getEmailTranslation(input: EmailTranslationInput) {
    const templateEmails = await this.hotelTemplateEmailRepository.getEmailTranslations({
      hotelId: input.hotelId,
      code: input.code
    });
    const mappingData = templateEmails?.map((template) => {
      const newData = {
        id: template.id,
        hotelId: template.hotelId,
        code: template.code,
        languageCode: template.languageCode,
        title: template.title,
        openingSection: template.openingSection,
        closingSection: template.closingSection
        // openingSectionForReturningGuest: template.openingSectionForReturningGuest,
        // signature: template.signature,
      };
      return newData;
    });
    return mappingData;
  }

  async updateEmailTranslation(input: UpdateEmailTranslationInput[]) {
    await this.hotelTemplateEmailRepository.updateEmailTranslation(input);
    return {
      status: ResponseContentStatusEnum.SUCCESS,
      data: true,
      message: 'Email translation updated successfully'
    };
  }

  async migrateEmailTranslation(input: { hotelId: string }) {
    const emailTranslationConfig = await this.translationEntityConfigRepository.findOneByCode(
      EntityTranslationConfigCodeEnum.EMAIL_CONTENT
    );

    if (!emailTranslationConfig) {
      return false;
    }

    const languageBundles = await this.translationHotelLanguageBundleRepository.findAll({
      hotelId: input.hotelId,
      relations: {
        i18nLocale: true
      }
    });

    const templateEmailOriginals = await this.hotelTemplateEmailRepository.getHotelTemplateEmails({
      hotelId: input.hotelId,
      codes: [
        HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION,
        HotelTemplateEmailCodeEnum.CPP_PROPOSAL_BOOKING_CONFIRMATION,
        HotelTemplateEmailCodeEnum.CPP_VERIFY_BOOKING_CONFIRMATION,
        HotelTemplateEmailCodeEnum.RELEASED_EMAIL,
        HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION
      ],
      languageCode: LanguageCodeEnum.EN
    });

    const entityIds = templateEmailOriginals?.map((template) => template.id);

    for (const languageCode of Object.values(LanguageCodeEnum)) {
      if (languageCode === LanguageCodeEnum.EN) continue;

      const languageBundle = languageBundles?.find((bundle) =>
        bundle.i18nLocale.code.toLowerCase().includes(languageCode.toLowerCase())
      );
      if (!languageBundle) continue;

      const translationEntityConfigs = await this.translationDynamicContentRepository.findAll({
        entityIds: entityIds,
        translationHotelLanguageBundleIds: [languageBundle.id],
        translationEntityConfigIds: [emailTranslationConfig.id]
      });

      const templateEmails = await this.hotelTemplateEmailRepository.getHotelTemplateEmails({
        hotelId: input.hotelId,
        codes: [
          HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION,
          HotelTemplateEmailCodeEnum.CPP_PROPOSAL_BOOKING_CONFIRMATION,
          HotelTemplateEmailCodeEnum.CPP_VERIFY_BOOKING_CONFIRMATION,
          HotelTemplateEmailCodeEnum.RELEASED_EMAIL,
          HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION
        ],
        languageCode: languageCode
      });

      for (const templateEmail of templateEmails) {
        const originalTemplateEmail = templateEmailOriginals?.find(
          (email) => email.code === templateEmail.code
        );
        if (!originalTemplateEmail) continue;
        const translationEntityConfig = translationEntityConfigs?.find(
          (config) => config.entityId === originalTemplateEmail.id
        );
        if (!translationEntityConfig) continue;

        const attribute = translationEntityConfig.attribute
          ? JSON.parse(translationEntityConfig.attribute as any)
          : [];
        const title = attribute?.find((attr) => attr.key === 'TITLE')?.value;
        const openingSection = attribute?.find((attr) => attr.key === 'OPENING_SECTION')?.value;
        const closingSection = attribute?.find((attr) => attr.key === 'CLOSING_SECTION')?.value;

        const update: UpdateEmailContentInput = {
          id: templateEmail.id,
          title: templateEmail.title,
          code: templateEmail.code as HotelTemplateEmailCodeEnum,
          isEnable: templateEmail.isEnable,
          openingSection: templateEmail.openingSection,
          closingSection: templateEmail.closingSection
        };

        if (title) update.title = title;
        if (openingSection) update.openingSection = openingSection;
        if (closingSection) update.closingSection = closingSection;

        await this.hotelTemplateEmailRepository.updateEmailContent(update);
      }
    }

    return true;
  }

  private getAvailableDynamicFieldList(code: HotelTemplateEmailCodeEnum): string[] {
    const defaultDynamicFields: string[] = [
      '{{booker.firstName}}',
      '{{booker.lastName}}',
      '{{hotel.emailAddress}}',
      '{{hotel.name}}',
      '{{hotel.phone}}'
    ];

    switch (code) {
      case HotelTemplateEmailCodeEnum.CPP_PROPOSAL_BOOKING_CONFIRMATION:
        defaultDynamicFields.push('{{booking.expiryDateStr}}');
        break;
      default:
        break;
    }

    return defaultDynamicFields;
  }

  private transformToDto(templateEmail: HotelTemplateEmail): HotelTemplateEmailDto {
    return {
      id: templateEmail.id,
      hotelId: templateEmail.hotelId,
      code: templateEmail.code,
      name: templateEmail.name,
      languageCode: templateEmail.languageCode,
      templateId: templateEmail.templateId,
      openingSection: templateEmail.openingSection,
      openingSectionForReturningGuest: templateEmail.openingSectionForReturningGuest,
      closingSection: templateEmail.closingSection,
      signature: templateEmail.signature,
      isDefault: templateEmail.isDefault,
      title: templateEmail.title,
      isEnable: templateEmail.isEnable,
      // These would need to be derived from the template or configuration
      subject: templateEmail.title, // Using title as subject for now
      senderName: undefined, // Would come from hotel configuration
      senderEmail: undefined // Would come from hotel configuration
    };
  }
}
