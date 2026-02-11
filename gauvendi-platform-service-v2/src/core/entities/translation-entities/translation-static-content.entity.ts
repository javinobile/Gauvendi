import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { TranslationEntityConfig } from './translation-entity-config.entity';
import { TranslationI18nLocale } from './translation-i18n-locale.entity';

@Index('fk_sct_etc_id', ['etcId'], {})
@Index('idx_i18n_locale_etc', ['i18nLocaleId', 'etcId'], {})
@Index('idx_i18n_locale', ['i18nLocaleId'], {})
@Entity({ name: 'translation_static_content' })
export class TranslationStaticContent extends BaseEntityWithDeleted {
  @Column('uuid', { name: 'i18n_locale_id' })
  i18nLocaleId: string;

  @Column('uuid', { name: 'etc_id' })
  etcId: string;

  @Column('jsonb', { name: 'attribute', nullable: true })
  attribute: any[] | null;

  @ManyToOne(
    () => TranslationEntityConfig,
    (entityTranslationConfig) => entityTranslationConfig.staticContentTranslations,
    {
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  )
  @JoinColumn([{ name: 'etc_id', referencedColumnName: 'id' }])
  etc: TranslationEntityConfig;

  @ManyToOne(() => TranslationI18nLocale, (i18nLocale) => i18nLocale.staticContentTranslations, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT'
  })
  @JoinColumn([{ name: 'i18n_locale_id', referencedColumnName: 'id' }])
  i18nLocale: TranslationI18nLocale;
}
