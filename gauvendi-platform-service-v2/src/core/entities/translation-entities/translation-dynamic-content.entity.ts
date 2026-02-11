import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { TranslationEntityConfig } from './translation-entity-config.entity';
import { TranslationHotelLanguageBundle } from './translation-hotel-language-bundle.entity';

@Index('fk_dct_etc_id', ['etcId'], {})
@Index('idx_hlb_etc', ['hlbId', 'etcId'], {})
@Index('idx_hlb_etc_entity', ['hlbId', 'etcId', 'entityId'], {})
@Entity({ name: 'translation_dynamic_content' })
export class TranslationDynamicContent extends BaseEntityWithDeleted {
  @Column('uuid', { name: 'entity_id' })
  entityId: string;

  @Column('uuid', { name: 'hlb_id' })
  hlbId: string;

  @Column('uuid', { name: 'etc_id' })
  etcId: string;

  @Column('jsonb', { name: 'attribute', nullable: true })
  attribute: any[] | null;

  @ManyToOne(
    () => TranslationEntityConfig,
    (entityTranslationConfig) => entityTranslationConfig.dynamicContentTranslations,
    {
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  )
  @JoinColumn([{ name: 'etc_id', referencedColumnName: 'id' }])
  etc: TranslationEntityConfig;

  @ManyToOne(
    () => TranslationHotelLanguageBundle,
    (hotelLanguageBundle) => hotelLanguageBundle.dynamicContentTranslations,
    {
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  )
  @JoinColumn([{ name: 'hlb_id', referencedColumnName: 'id' }])
  hlb: TranslationHotelLanguageBundle;
}
