import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { TranslationEntityConfig } from 'src/core/entities/translation-entities/translation-entity-config.entity';
import { TranslationI18nLocale } from 'src/core/entities/translation-entities/translation-i18n-locale.entity';
import { TranslationRepository } from '../repositories/translation.repository';
import { TranslationStaticContent } from 'src/core/entities/translation-entities/translation-static-content.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [TranslationEntityConfig, TranslationI18nLocale, TranslationStaticContent],
      DB_NAME.POSTGRES
    ),
    ConfigModule
  ],
  providers: [TranslationRepository],
  exports: [TypeOrmModule, TranslationRepository]
})
export class TranslationSharedModule {}
