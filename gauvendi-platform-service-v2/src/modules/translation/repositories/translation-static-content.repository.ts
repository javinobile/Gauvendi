import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { TranslationStaticContent } from '@src/core/entities/translation-entities/translation-static-content.entity';
import {
  TranslationEntityConfig,
  EntityTranslationConfigCodeEnum
} from '@src/core/entities/translation-entities/translation-entity-config.entity';
import { TranslationI18nLocale } from '@src/core/entities/translation-entities/translation-i18n-locale.entity';
import { BadRequestException } from '@src/core/exceptions';

export interface StaticContentTranslationDto {
  entityTranslationConfig: {
    code: EntityTranslationConfigCodeEnum;
    name: string;
  };
  attribute: Array<{ key: string; value: string }>;
}

@Injectable()
export class TranslationStaticContentRepository {
  constructor(
    @InjectRepository(TranslationStaticContent, DbName.Postgres)
    private readonly translationStaticContentRepository: Repository<TranslationStaticContent>,
    @InjectRepository(TranslationEntityConfig, DbName.Postgres)
    private readonly translationEntityConfigRepository: Repository<TranslationEntityConfig>,
    @InjectRepository(TranslationI18nLocale, DbName.Postgres)
    private readonly translationI18nLocaleRepository: Repository<TranslationI18nLocale>
  ) {}

  async getStaticContentTranslation(localeCode: string): Promise<StaticContentTranslationDto[]> {
    try {
      // Find the locale by code
      const locale = await this.translationI18nLocaleRepository.findOne({
        where: { code: localeCode }
      });

      if (!locale) {
        // Fallback to English if locale not found
        const englishLocale = await this.translationI18nLocaleRepository.findOne({
          where: { code: 'EN' }
        });

        if (!englishLocale) {
          throw new BadRequestException(`Locale ${localeCode} and fallback EN not found`);
        }

        return this.getTranslationsByLocale(englishLocale.id);
      }

      return this.getTranslationsByLocale(locale.id);
    } catch (error) {
      throw new BadRequestException(`Failed to get static content translation: ${error.message}`);
    }
  }

  private async getTranslationsByLocale(localeId: string): Promise<StaticContentTranslationDto[]> {
    const translations = await this.translationStaticContentRepository.find({
      where: { i18nLocaleId: localeId },
      relations: ['etc'],
      order: { etc: { code: 'ASC' } }
    });

    return translations.map((translation) => ({
      entityTranslationConfig: {
        code: translation.etc.code,
        name: translation.etc.name
      },
      attribute: translation.attribute || []
    }));
  }

  async getEmailTranslationContent(localeCode: string): Promise<{ [key: string]: string }> {
    try {
      const staticContent = await this.getStaticContentTranslation(localeCode);

      // Find EMAIL_TRANSLATION_CONTENT
      const emailTranslationContent = staticContent.find(
        (content) =>
          content.entityTranslationConfig.code ===
          EntityTranslationConfigCodeEnum.EMAIL_TRANSLATION_CONTENT
      );
      if (
        emailTranslationContent?.attribute &&
        typeof emailTranslationContent.attribute === 'string'
      ) {
        emailTranslationContent.attribute = JSON.parse(emailTranslationContent.attribute || '[]');
      }

      if (!emailTranslationContent) {
        return {};
      }

      // Flatten the attribute array to key-value pairs
      const flattenedTranslations: { [key: string]: string } = {};
      emailTranslationContent.attribute.forEach((attr) => {
        if (attr.key) {
          flattenedTranslations[attr.key] = attr.value || '';
        }
      });

      return flattenedTranslations;
    } catch (error) {
      throw new BadRequestException(`Failed to get email translation content: ${error.message}`);
    }
  }
}
