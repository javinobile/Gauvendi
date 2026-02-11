import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { TranslationDynamicContent } from '@src/core/entities/translation-entities/translation-dynamic-content.entity';
import { LanguageCodeEnum } from '@src/core/enums/common';
import {
  DynamicContentTranslationDto,
  DynamicContentTranslationFilterDto
} from '../dtos/dynamic-content-translation-filter.dto';
import { UpdateDynamicContentTranslationInput } from '../dtos/update-dynamic-content-translation.input';
import { TranslationDynamicContentRepository } from '../repositories/translation-dynamic-content.repository';
import { TranslationEntityConfigRepository } from '../repositories/translation-entity-config.repository';
import { TranslationHotelLanguageBundleRepository } from '../repositories/translation-hotel-language-bundle.repository';
import { TranslationStaticContentRepository } from '../repositories/translation-static-content.repository';
import {
  EntityTranslationConfigCodeEnum,
  TranslationEntityConfig
} from '@src/core/entities/translation-entities/translation-entity-config.entity';
import { LOCALES_MAP } from '@src/modules/reservation/constants/reservation-notes.const';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { TranslationI18nLocale } from '@src/core/entities/translation-entities/translation-i18n-locale.entity';
import { In, Repository } from 'typeorm';
import { BadRequestException } from '@src/core/exceptions';
import { TranslationHotelLanguageBundle } from '@src/core/entities/translation-entities/translation-hotel-language-bundle.entity';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(
    private readonly translationDynamicContentRepository: TranslationDynamicContentRepository,
    private readonly translationStaticContentRepository: TranslationStaticContentRepository,
    private readonly translationHotelLanguageBundleRepository: TranslationHotelLanguageBundleRepository,
    private readonly translationEntityConfigRepository: TranslationEntityConfigRepository,

    @InjectRepository(TranslationI18nLocale, DbName.Postgres)
    private readonly translationI18nLocaleRepository: Repository<TranslationI18nLocale>,

    @InjectRepository(TranslationEntityConfig, DbName.Postgres)
    private readonly translationEntityConfigRepos: Repository<TranslationEntityConfig>,

    @InjectRepository(TranslationHotelLanguageBundle, DbName.Postgres)
    private readonly translationHotelLanguageBundleEntity: Repository<TranslationHotelLanguageBundle>
  ) {}

  async getEmailStaticContentTranslation(language?: string): Promise<{ [key: string]: string }> {
    try {
      const localeCode = this.parseLanguageToLocaleCode(language);

      this.logger.log(
        `[getEmailStaticContentTranslation] Getting email translations for locale: ${localeCode}`
      );

      const translations =
        await this.translationStaticContentRepository.getEmailTranslationContent(localeCode);

      if (Object.keys(translations).length === 0) {
        this.logger.warn(
          `[getEmailStaticContentTranslation] No email translations found for locale ${localeCode}, using fallback`
        );
        return this.getFallbackEmailTranslations();
      }

      return translations;
    } catch (error) {
      this.logger.error(`[getEmailStaticContentTranslation] Error: ${error.message}`);
      return this.getFallbackEmailTranslations();
    }
  }

  async getDynamicContentTranslation(
    filter: DynamicContentTranslationFilterDto
  ): Promise<DynamicContentTranslationDto[]> {
    try {
      const { hotelId, localeCodes, entityIds } = filter;
      const translationHotelLanguageBundles =
        await this.translationHotelLanguageBundleRepository.findAll(
          {
            hotelId: hotelId,
            localeCodes: localeCodes,
            relations: { i18nLocale: true }
          },
          { id: true, i18nLocale: { code: true } }
        );

      const translationHotelLanguageBundleIds = translationHotelLanguageBundles.map(
        (translationHotelLanguageBundle) => translationHotelLanguageBundle.id
      );

      const translationDynamicContents = await this.translationDynamicContentRepository.findAll(
        {
          translationHotelLanguageBundleIds,
          entityIds: entityIds,
          relations: { etc: true }
        },
        { id: true, entityId: true, hlbId: true, etcId: true, attribute: true, etc: { code: true } }
      );

      return translationDynamicContents.map((translationDynamicContent) => {
        const translationHotelLanguageBundle = translationHotelLanguageBundles.find(
          (translationHotelLanguageBundle) =>
            translationHotelLanguageBundle.id === translationDynamicContent.hlbId
        );

        return {
          id: translationDynamicContent.id,
          entityId: translationDynamicContent.entityId,
          localeCode: translationHotelLanguageBundle?.i18nLocale.code || '',
          entityTranslationConfigCode: translationDynamicContent.etc.code,
          attribute: translationDynamicContent.attribute,
          entityMetadata: null
        };
      });
    } catch (error) {
      this.logger.error(`[getDynamicContentTranslation] Error: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to get dynamic content translation: ${error.message}`
      );
    }
  }

  async findDynamicContentTranslationEntities(
    filter: DynamicContentTranslationFilterDto
  ): Promise<TranslationDynamicContent[]> {
    try {
      const { hotelId, entityIds } = filter;
      const translationHotelLanguageBundles =
        await this.translationHotelLanguageBundleRepository.findAll(
          {
            hotelId: hotelId,
            relations: { i18nLocale: true }
          },
          { id: true, i18nLocale: { code: true } }
        );

      const translationHotelLanguageBundleIds = translationHotelLanguageBundles.map(
        (translationHotelLanguageBundle) => translationHotelLanguageBundle.id
      );

      return await this.translationDynamicContentRepository.findAll(
        {
          translationHotelLanguageBundleIds,
          entityIds: entityIds,
          relations: { etc: true }
        },
        { id: true, entityId: true, hlbId: true, etcId: true, attribute: true, etc: { code: true } }
      );
    } catch (error) {
      this.logger.error(`[findDynamicContentTranslationEntities] Error: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to find dynamic content translation entities: ${error.message}`
      );
    }
  }

  async updateDynamicContentTranslation(
    input: UpdateDynamicContentTranslationInput
  ): Promise<TranslationDynamicContent[]> {
    try {
      const { hotelId, localeData } = input;
      const localeCodes = localeData.map((locale) => locale.localeCode);
      const entityTranslationConfigCodes = localeData.flatMap((locale) =>
        locale.data.map((data) => data.entityTranslationConfigCode)
      );
      const translationHotelLanguageBundles = await this.translationHotelLanguageBundleEntity.find({
        where: {
          hotelId,
          i18nLocale: {
            code: In(localeCodes)
          }
        },
        relations: { i18nLocale: true }
      });

      const translationEntityConfigs = await this.translationEntityConfigRepository.findAll(
        {
          codes: entityTranslationConfigCodes
        },
        { id: true, code: true }
      );
      const translationHotelLanguageBundleIds = translationHotelLanguageBundles.map(
        (translationHotelLanguageBundle) => translationHotelLanguageBundle.id
      );
      const translationEntityConfigIds = translationEntityConfigs.map(
        (translationEntityConfig) => translationEntityConfig.id
      );

      const entityIds = localeData.flatMap((locale) => locale.data.map((data) => data.entityId));

      const existingTranslationDynamicContents =
        await this.translationDynamicContentRepository.findAll({
          translationHotelLanguageBundleIds: translationHotelLanguageBundleIds,
          translationEntityConfigIds: translationEntityConfigIds,
          entityIds: entityIds
        });

      const i18nLocales = await this.translationI18nLocaleRepository.find({});

      let newTranslationDynamicContents: TranslationDynamicContent[] = [];
      let updatedTranslationDynamicContents: TranslationDynamicContent[] = [];
      for (const locale of localeData) {
        for (const data of locale.data) {
          let translationHotelLanguageBundle = translationHotelLanguageBundles.find(
            (translationHotelLanguageBundle) =>
              translationHotelLanguageBundle.i18nLocale.code === locale.localeCode
          );
          const translationEntityConfig = translationEntityConfigs.find(
            (translationEntityConfig) =>
              translationEntityConfig.code === data.entityTranslationConfigCode
          );

          if (!translationEntityConfig) {
            continue;
          }
          if (!translationHotelLanguageBundle) {
            // create new translationHotelLanguageBundle
            const i18nLocale = i18nLocales.find(
              (i18nLocale) => i18nLocale.code === locale.localeCode
            );
            const newTranslationHotelLanguageBundle = new TranslationHotelLanguageBundle();
            newTranslationHotelLanguageBundle.hotelId = hotelId;
            newTranslationHotelLanguageBundle.i18nLocaleId = i18nLocale?.id || '';
            newTranslationHotelLanguageBundle.paid = false;
            newTranslationHotelLanguageBundle.isActive = true;
            await this.translationHotelLanguageBundleEntity.save(newTranslationHotelLanguageBundle);
            translationHotelLanguageBundle = newTranslationHotelLanguageBundle;
          }

          const existingTranslationDynamicContent = existingTranslationDynamicContents.find(
            (existingTranslationDynamicContent) =>
              existingTranslationDynamicContent.hlbId === translationHotelLanguageBundle?.id &&
              existingTranslationDynamicContent.etcId === translationEntityConfig.id &&
              existingTranslationDynamicContent.entityId === data.entityId
          );

          if (existingTranslationDynamicContent) {
            existingTranslationDynamicContent.attribute = data.attribute || null;
            updatedTranslationDynamicContents.push(existingTranslationDynamicContent);
          } else {
            const newTranslationDynamicContent = new TranslationDynamicContent();

            newTranslationDynamicContent.hlbId = translationHotelLanguageBundle.id;
            newTranslationDynamicContent.etcId = translationEntityConfig.id;
            newTranslationDynamicContent.entityId = data.entityId;
            newTranslationDynamicContent.attribute = data.attribute || null;
            newTranslationDynamicContents.push(newTranslationDynamicContent);
          }
        }
      }

      return await this.translationDynamicContentRepository.saveAll([
        ...newTranslationDynamicContents,
        ...updatedTranslationDynamicContents
      ]);
    } catch (error) {
      this.logger.error(`[updateDynamicContentTranslation] Error: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to update dynamic content translation: ${error.message}`
      );
    }
  }

  private parseLanguageToLocaleCode(language?: string): string {
    const localesMap = {
      [LanguageCodeEnum.EN]: 'en-EN',
      [LanguageCodeEnum.NL]: 'nl-NL',
      [LanguageCodeEnum.ES]: 'es-ES',
      [LanguageCodeEnum.IT]: 'it-IT',
      [LanguageCodeEnum.AR]: 'ar-AE',
      [LanguageCodeEnum.FR]: 'fr-FR',
      [LanguageCodeEnum.DE]: 'de-DE'
    };

    return localesMap[language || LanguageCodeEnum.EN];
  }

  private getFallbackEmailTranslations(): { [key: string]: string } {
    return {
      'email.greeting': 'Dear Guest',
      'email.booking.confirmation': 'Booking Confirmation',
      'email.thank.you': 'Thank you for your booking',
      'email.reservation.details': 'Reservation Details',
      'email.check.in': 'Check-in',
      'email.check.out': 'Check-out',
      'email.guests': 'Guests',
      'email.room.type': 'Room Type',
      'email.total.amount': 'Total Amount',
      'email.payment.information': 'Payment Information',
      'email.contact.us': 'Contact Us',
      'email.best.regards': 'Best regards',
      'email.booking.number': 'Booking Number',
      'email.confirmation.number': 'Confirmation Number',
      'email.arrival.date': 'Arrival Date',
      'email.departure.date': 'Departure Date',
      'email.number.of.nights': 'Number of Nights',
      'email.adults': 'Adults',
      'email.children': 'Children',
      'email.special.requests': 'Special Requests',
      'email.cancellation.policy': 'Cancellation Policy',
      'email.terms.conditions': 'Terms & Conditions'
    };
  }

  async getStaticContentTranslations({
    code,
    translateTo
  }: {
    code: EntityTranslationConfigCodeEnum;
    translateTo: LanguageCodeEnum;
  }) {
    try {
      const localeCode = LOCALES_MAP[translateTo];
      const locale = await this.translationI18nLocaleRepository.findOne({
        where: { code: localeCode }
      });

      const translationEntityConfig = await this.translationEntityConfigRepos.findOne({
        where: { code, staticContentTranslations: { i18nLocaleId: locale?.id } },
        relations: ['staticContentTranslations']
      });

      const staticContentTranslations =
        translationEntityConfig?.staticContentTranslations?.[0]?.attribute || [];
      return staticContentTranslations;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
