import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { HotelRetailCategory } from './hotel-retail-category.entity';

@Entity({ name: 'hotel_retail_category_translation' })
@Index(['hotelRetailCategoryId'])
export class HotelRetailCategoryTranslation extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_retail_category_id', nullable: false })
  hotelRetailCategoryId: string;

  @Column({ type: 'text', name: 'language_code', nullable: false })
  languageCode: string;

  @Column({ type: 'text', name: 'name', nullable: false })
  name: string;

  // Relations
  @ManyToOne(() => HotelRetailCategory, (category) => category.hotelRetailCategoryTranslations)
  @JoinColumn({ name: 'hotel_retail_category_id' })
  hotelRetailCategory: HotelRetailCategory;
}