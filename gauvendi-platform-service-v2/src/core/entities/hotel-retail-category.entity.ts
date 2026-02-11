import { Column, Entity, Index, OneToMany } from 'typeorm';
import {
  BaseEntity,
  BaseEntityWithTranslations,
  BaseEntityWithTranslationsDeleted
} from '../database/entities/base.entity';
import { CategoryTypeEnum } from '../enums/common';
import { HotelRetailCategoryTranslation } from './hotel-retail-category-translation.entity';
import { HotelRetailFeature } from './hotel-retail-feature.entity';

@Entity({ name: 'hotel_retail_category' })
@Index(['hotelId'])
@Index(['hotelId', 'code'])
@Index(['hotelId', 'categoryType'])
export class HotelRetailCategory extends BaseEntityWithTranslations {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'text', name: 'code', nullable: false })
  code: string;

  @Column({ type: 'text', name: 'name', nullable: false })
  name: string;

  @Column({
    type: 'text',
    name: 'category_type',
    nullable: true
  })
  categoryType: CategoryTypeEnum;

  @Column({ type: 'integer', name: 'display_sequence', nullable: true })
  displaySequence: number;

  @Column({ type: 'integer', name: 'price_weight', nullable: true })
  priceWeight: number;

  // Relations
  @OneToMany(
    () => HotelRetailFeature,
    (hotelRetailFeature) => hotelRetailFeature.hotelRetailCategory
  )
  hotelRetailFeatures: HotelRetailFeature[];

  @OneToMany(
    () => HotelRetailCategoryTranslation,
    (hotelRetailCategoryTranslation) => hotelRetailCategoryTranslation.hotelRetailCategory
  )
  hotelRetailCategoryTranslations: HotelRetailCategoryTranslation[];
}
