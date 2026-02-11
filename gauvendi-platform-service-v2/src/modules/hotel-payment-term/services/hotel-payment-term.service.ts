import { Injectable, Logger } from '@nestjs/common';
import { ResponseContentStatusEnum } from '@src/core/dtos/common.dto';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { InternalServerErrorException } from '@src/core/exceptions';
import { GlobalPaymentMethodRepository } from '@src/modules/global-payment-method/repositories/global-payment-method.repository';
import {
  HotelPaymentTermFilterDto,
  HotelPaymentTermInputDto,
  HotelPaymentTermResponseDto
} from '../dtos/hotel-payment-term.dto';
import { HotelPaymentTermRepository } from '../repositories/hotel-payment-term.repository';

@Injectable()
export class HotelPaymentTermService {
  private readonly logger = new Logger(HotelPaymentTermService.name);

  constructor(
    private readonly hotelPaymentTermRepository: HotelPaymentTermRepository,
    private readonly globalPaymentMethodRepository: GlobalPaymentMethodRepository
  ) {}

  async hotelPaymentTermsMigrateTranslation() {
    try {
      // Get all translation data in a single optimized query
      const allTranslationData = await this.hotelPaymentTermRepository[
        'hotelPaymentTermRepository'
      ].manager
        .createQueryBuilder()
        .select([
          'hpt.id as hotel_payment_term_id',
          'hpt.code as hotel_payment_term_code',
          'tdc.attribute as attribute',
          'til.code as locale_code'
        ])
        .from('hotel_payment_term', 'hpt')
        .innerJoin('translation_dynamic_content', 'tdc', 'tdc.entity_id = hpt.id')
        .leftJoin('translation_hotel_language_bundle', 'thlb', 'tdc.hlb_id = thlb.id')
        .leftJoin('translation_i18n_locale', 'til', 'thlb.i18n_locale_id = til.id')
        .where('hpt.translations = :emptyArray', { emptyArray: '[]' })
        .andWhere('tdc.deleted_at IS NULL')
        .andWhere('thlb.deleted_at IS NULL')
        .andWhere('til.deleted_at IS NULL')
        .getRawMany();

      const mappedTranslationKey = new Map<string, string>([
        ['PAY_AT_PROPERTY_DESCRIPTION', 'payAtPropertyDescription'],
        ['PAY_UPON_BOOKING_DESCRIPTION', 'payUponBookingDescription'],
        ['NAME', 'name'],
        ['DESCRIPTION', 'description']
      ]);

      this.logger.log(`Found ${allTranslationData.length} translation records to process`);

      // Group translation data by hotel payment term ID
      const translationsByHotelPaymentTerm = new Map<
        string,
        {
          hotelPaymentTermCode: string;
          translationData: any[];
        }
      >();

      for (const data of allTranslationData) {
        if (!data.hotel_payment_term_id) {
          continue;
        }

        if (!translationsByHotelPaymentTerm.has(data.hotel_payment_term_id)) {
          translationsByHotelPaymentTerm.set(data.hotel_payment_term_id, {
            hotelPaymentTermCode: data.hotel_payment_term_code,
            translationData: []
          });
        }

        translationsByHotelPaymentTerm.get(data.hotel_payment_term_id)!.translationData.push(data);
      }

      this.logger.log(
        `Found ${translationsByHotelPaymentTerm.size} hotel payment terms to migrate translations`
      );

      // Process each hotel payment term with the same logic as room product
      for (const [
        hotelPaymentTermId,
        { hotelPaymentTermCode, translationData }
      ] of translationsByHotelPaymentTerm) {
        if (translationData.length === 0) {
          continue;
        }

        // Build translations array
        const translations: any[] = [];

        for (const data of translationData) {
          if (!data.attribute || !data.locale_code) {
            continue;
          }

          // Convert locale code (e.g., "es-ES") to language code (e.g., "ES")
          const languageCode = this.extractLanguageCode(data.locale_code);

          if (!languageCode) {
            continue;
          }

          // Parse the attribute JSON and build translation object
          const translationObj: any = {
            languageCode: languageCode
          };

          // Parse available attribute keys to know what fields to extract
          const availableKeys = [
            'name',
            'description',
            'payAtHotelDescription',
            'payAtPropertyDescription',
            'payOnConfirmationDescription',
            'payUponBookingDescription'
          ];

          // Extract translation data from attribute JSON
          const attributeObject = JSON.parse(data.attribute);
          if (Array.isArray(attributeObject)) {
            for (const attr of attributeObject) {
              if (attr && typeof attr === 'object') {
                for (const key of availableKeys) {
                  if (attr[key] || attr[`${key}`.toLowerCase()] || attr[key.toUpperCase()]) {
                    const value =
                      attr[key] || attr[`${key}`.toLowerCase()] || attr[key.toUpperCase()];
                    translationObj[`${key}`.toLowerCase()] = value;
                  } else if (attr['key']) {
                    const mappedKey =
                      mappedTranslationKey.get(attr['key']) || `${attr['key']}`.toLowerCase();
                    translationObj[mappedKey] = attr['value'] || '';
                  }
                }
              }
            }
          } else if (attributeObject && typeof attributeObject === 'object') {
            for (const key of availableKeys) {
              if (
                attributeObject[key] ||
                attributeObject[`${key}`.toLowerCase()] ||
                attributeObject[key.toUpperCase()]
              ) {
                translationObj[`${key}`.toLowerCase()] = attributeObject[`${key}`.toLowerCase()];
              }
            }
          }

          // Only add translation if it has content beyond just languageCode
          if (Object.keys(translationObj).length > 1) {
            translations.push(translationObj);
          }
        }

        // Update hotel payment term with translations
        if (translations.length > 0) {
          await this.hotelPaymentTermRepository['hotelPaymentTermRepository'].manager
            .createQueryBuilder()
            .update(HotelPaymentTerm)
            .set({ translations: translations })
            .where('id = :id', { id: hotelPaymentTermId })
            .execute();

          this.logger.log(
            `Migrated ${translations.length} translations for hotel payment term ${hotelPaymentTermCode}`
          );
        }
      }

      this.logger.log('Hotel payment term translation migration completed successfully');
      return {
        message: 'Hotel payment term translations migrated successfully',
        migratedCount: translationsByHotelPaymentTerm.size,
        totalTranslationRecords: allTranslationData.length
      };
    } catch (error) {
      this.logger.error('hotelPaymentTermsMigrateTranslation: ', JSON.stringify(error));
      throw new InternalServerErrorException(error);
    }
  }

  private extractLanguageCode(localeCode: string): string | null {
    if (!localeCode) return null;

    // Convert locale codes like "es-ES", "en-US", "fr-FR" to language codes like "ES", "EN", "FR"
    const parts = localeCode.split('-');
    if (parts.length >= 2) {
      const languageCode = parts[1].toUpperCase();

      // Validate against LanguageCodeEnum
      const validLanguageCodes = ['EN', 'FR', 'DE', 'IT', 'ES', 'NL', 'AR'];
      if (validLanguageCodes.includes(languageCode)) {
        return languageCode;
      }
    }

    // Fallback: try first part if it matches valid language codes
    const firstPart = parts[0].toUpperCase();
    const validLanguageCodes = ['EN', 'FR', 'DE', 'IT', 'ES', 'NL', 'AR'];
    if (validLanguageCodes.includes(firstPart)) {
      return firstPart;
    }

    return null;
  }

  async getHotelPaymentTerms(filter: HotelPaymentTermFilterDto) {
    const data = await this.hotelPaymentTermRepository.getHotelPaymentTerms(filter);
    const mappedData = await this.mapHotelPaymentTerms(data);
    return mappedData;
  }

  private async mapHotelPaymentTerms(
    data: HotelPaymentTerm[]
  ): Promise<HotelPaymentTermResponseDto[]> {
    const paymentMethodCodes = data?.flatMap((item) => item.supportedPaymentMethodCodes);
    const paymentMethodsData = await this.globalPaymentMethodRepository.getGlobalPaymentMethodList({
      codes: paymentMethodCodes
    });

    const mappedData: HotelPaymentTermResponseDto[] = data.map((item) => {
      const paymentMethods = paymentMethodsData?.filter((method) =>
        item.supportedPaymentMethodCodes.includes(method.code)
      );
      return {
        id: item.id,
        name: item.name,
        code: item.code,
        payOnConfirmation: Number(item.payOnConfirmation),
        payAtHotel: Number(item.payAtHotel),
        description: item.description,
        payAtHotelDescription: item.payAtHotelDescription,
        payOnConfirmationDescription: item.payOnConfirmationDescription,
        supportedPaymentMethodCodes: item.supportedPaymentMethodCodes,
        paymentMethodList: paymentMethods?.map((method) => ({
          id: method.id,
          code: method.code,
          name: method.name,
          description: method.description,
          supportedPaymentProviderCodeList: method.supportedPaymentProviderCodes
        })),
        translationList: item.translations.map((translation) => ({
          id: translation.id,
          hotelId: translation.hotelId,
          hotelPaymentTermId: translation.hotelPaymentTermId,
          languageCode: translation.languageCode,
          name: translation.name,
          description: translation.description,
          payAtHotelDescription: translation.payAtHotelDescription,
          payUponBookingDescription: translation.payUponBookingDescription,
          payOnConfirmationDescription: translation.payOnConfirmationDescription
        })),
        supportedPaymentMethodCodeList: item.supportedPaymentMethodCodes
      };
    });
    return mappedData;
  }

  async createOrUpdateHotelPaymentTerm(input: HotelPaymentTermInputDto) {
    await this.hotelPaymentTermRepository.createOrUpdateHotelPaymentTerm(input);
    return {
      status: ResponseContentStatusEnum.SUCCESS,
      message: `${input.id ? 'Updated' : 'Created'} hotel payment term successfully`,
      data: null
    };
  }

  async deleteHotelPaymentTerm(input: HotelPaymentTermFilterDto) {
    await this.hotelPaymentTermRepository.deleteHotelPaymentTerm(input);
    return {
      status: ResponseContentStatusEnum.SUCCESS,
      message: 'Deleted hotel payment terms successfully',
      data: null
    };
  }
}
