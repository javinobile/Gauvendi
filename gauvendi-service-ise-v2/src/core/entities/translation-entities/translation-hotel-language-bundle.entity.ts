import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { TranslationDynamicContent } from './translation-dynamic-content.entity';
import { TranslationI18nLocale } from './translation-i18n-locale.entity';

@Index('fk_locale_id', ['i18nLocaleId'], {})
@Index('idx_hotel_locale', ['hotelId', 'i18nLocaleId'], {})
@Entity({ name: 'translation_hotel_language_bundle' })
export class TranslationHotelLanguageBundle extends BaseEntityWithDeleted {
  @Column('uuid', { name: 'hotel_id' })
  hotelId: string;

  @Column('uuid', { name: 'i18n_locale_id' })
  i18nLocaleId: string;

  @Column('boolean', {
    name: 'paid',
    nullable: true,
    default: false
  })
  paid: boolean | null;

  @Column('boolean', {
    name: 'is_active',
    nullable: true,
    default: true
  })
  isActive: boolean | null;

  @OneToMany(
    () => TranslationDynamicContent,
    (dynamicContentTranslation) => dynamicContentTranslation.hlb
  )
  dynamicContentTranslations: TranslationDynamicContent[];

  @ManyToOne(() => TranslationI18nLocale, (i18nLocale) => i18nLocale.hotelLanguageBundles, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT'
  })
  @JoinColumn([{ name: 'i18n_locale_id', referencedColumnName: 'id' }])
  i18nLocale: TranslationI18nLocale;
}
