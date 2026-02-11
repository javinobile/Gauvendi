import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { TranslationHotelLanguageBundle } from './translation-hotel-language-bundle.entity';
import { TranslationStaticContent } from './translation-static-content.entity';

@Index('unique_locale_code', ['code'], { unique: true })
@Entity({ name: 'translation_i18n_locale' })
export class TranslationI18nLocale extends BaseEntityWithDeleted {
  @Column('varchar', { name: 'name', length: 500 })
  name: string;

  @Column('varchar', { name: 'code', unique: true, length: 50 })
  code: string;

  @OneToMany(
    () => TranslationHotelLanguageBundle,
    (hotelLanguageBundle) => hotelLanguageBundle.i18nLocale
  )
  hotelLanguageBundles: TranslationHotelLanguageBundle[];

  @OneToMany(
    () => TranslationStaticContent,
    (staticContentTranslation) => staticContentTranslation.i18nLocale
  )
  staticContentTranslations: TranslationStaticContent[];
}
