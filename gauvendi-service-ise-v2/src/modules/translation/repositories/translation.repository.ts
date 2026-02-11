import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { LanguageCodeEnum } from 'src/core/database/entities/base.entity';
import {
  EntityTranslationConfigCodeEnum,
  TranslationEntityConfig
} from 'src/core/entities/translation-entities/translation-entity-config.entity';
import { TranslationI18nLocale } from 'src/core/entities/translation-entities/translation-i18n-locale.entity';
import { TranslationStaticContent } from 'src/core/entities/translation-entities/translation-static-content.entity';
import { LOCALES_MAP } from 'src/core/enums/common';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { Repository } from 'typeorm';

@Injectable()
export class TranslationRepository extends BaseService {
  constructor(
    @InjectRepository(TranslationEntityConfig, DB_NAME.POSTGRES)
    private readonly translationEntityConfigRepository: Repository<TranslationEntityConfig>,

    @InjectRepository(TranslationI18nLocale, DB_NAME.POSTGRES)
    private readonly translationI18nLocaleRepository: Repository<TranslationI18nLocale>,

    @InjectRepository(TranslationStaticContent, DB_NAME.POSTGRES)
    private readonly translationStaticContentRepository: Repository<TranslationStaticContent>,
    configService: ConfigService
  ) {
    super(configService);
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

      const translationEntityConfig = await this.translationEntityConfigRepository.findOne({
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
