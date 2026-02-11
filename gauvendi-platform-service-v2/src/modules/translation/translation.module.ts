import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { TranslationDynamicContent } from '@src/core/entities/translation-entities/translation-dynamic-content.entity';
import { TranslationEntityConfig } from '@src/core/entities/translation-entities/translation-entity-config.entity';
import { TranslationHotelLanguageBundle } from '@src/core/entities/translation-entities/translation-hotel-language-bundle.entity';
import { TranslationI18nLocale } from '@src/core/entities/translation-entities/translation-i18n-locale.entity';
import { TranslationStaticContent } from '@src/core/entities/translation-entities/translation-static-content.entity';
import { TranslationDynamicContentRepository } from './repositories/translation-dynamic-content.repository';
import { TranslationEntityConfigRepository } from './repositories/translation-entity-config.repository';
import { TranslationHotelLanguageBundleRepository } from './repositories/translation-hotel-language-bundle.repository';
import { TranslationStaticContentRepository } from './repositories/translation-static-content.repository';
import { TranslationService } from './services/translation.service';
import { TranslationController } from './translation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        TranslationStaticContent,
        TranslationEntityConfig,
        TranslationI18nLocale,
        TranslationHotelLanguageBundle,
        TranslationDynamicContent
      ],
      DbName.Postgres
    )
  ],
  providers: [
    TranslationStaticContentRepository,
    TranslationDynamicContentRepository,
    TranslationService,
    TranslationHotelLanguageBundleRepository,
    TranslationEntityConfigRepository
  ],
  controllers: [TranslationController],
  exports: [
    TranslationService,
    TranslationDynamicContentRepository,
    TranslationEntityConfigRepository,
    TranslationHotelLanguageBundleRepository,
    TranslationStaticContentRepository
  ]
})
export class TranslationModule {}
