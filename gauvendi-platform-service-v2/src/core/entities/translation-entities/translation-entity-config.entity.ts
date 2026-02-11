import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { TranslationDynamicContent } from './translation-dynamic-content.entity';
import { TranslationStaticContent } from './translation-static-content.entity';

export enum EntityTranslationConfigCodeEnum {
  // Static
  IBE_BOOKING_CONFIRMATION = 'IBE_BOOKING_CONFIRMATION',
  INTERNET_SALES_ENGINE_CONTENTS = 'INTERNET_SALES_ENGINE_CONTENTS',
  GAUVENDI_SIGNATURE_WIDGET_CONTENTS = 'GAUVENDI_SIGNATURE_WIDGET_CONTENTS',
  PDF_TRANSLATION_CONTENT = 'PDF_TRANSLATION_CONTENT',
  EMAIL_TRANSLATION_CONTENT = 'EMAIL_TRANSLATION_CONTENT',
  RESERVATION_COMMENT_TEMPLATE_CONTENT = 'RESERVATION_COMMENT_TEMPLATE_CONTENT',

  // Dynamic
  WIDGET_CONTENTS = 'WIDGET_CONTENTS',
  PAYMENT_TERM = 'PAYMENT_TERM',
  PAYMENT_METHOD = 'PAYMENT_METHOD',
  EMAIL_CONTENT = 'EMAIL_CONTENT',
  RFC = 'RFC',
  EVENT = 'EVENT'
}

@Index('unique_etc_code', ['code'], { unique: true })
@Entity({ name: 'translation_entity_config' })
export class TranslationEntityConfig extends BaseEntityWithDeleted {
  @Column('varchar', { name: 'name', length: 500 })
  name: string;

  @Column('boolean', {
    name: 'is_static',
    nullable: true,
    default: false
  })
  isStatic: boolean | null;

  @Column('varchar', { name: 'code', unique: true, length: 255 })
  code: EntityTranslationConfigCodeEnum;

  @Column('text', { name: 'available_attribute_key' })
  availableAttributeKey: string;

  @OneToMany(
    () => TranslationDynamicContent,
    (dynamicContentTranslation) => dynamicContentTranslation.etc
  )
  dynamicContentTranslations: TranslationDynamicContent[];

  @OneToMany(
    () => TranslationStaticContent,
    (staticContentTranslation) => staticContentTranslation.etc
  )
  staticContentTranslations: TranslationStaticContent[];
}
