import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { HotelRetailFeature } from './hotel-retail-feature.entity';

@Entity({ name: 'hotel_retail_feature_translation' })
@Index(['hotelRetailFeatureId'])
@Index(['hotelRetailFeatureId', 'languageCode'], { unique: true })
export class HotelRetailFeatureTranslation extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_retail_feature_id', nullable: false })
  hotelRetailFeatureId: string;

  @Column({ type: 'text', name: 'language_code', nullable: false })
  languageCode: string;

  @Column({ type: 'text', name: 'name', nullable: true })
  name: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'measurement_unit', nullable: true })
  measurementUnit: string;

  // Relations
  @ManyToOne(() => HotelRetailFeature, (feature) => feature.hotelRetailFeatureTranslations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotel_retail_feature_id' })
  hotelRetailFeature: HotelRetailFeature;
}