import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { HotelStandardFeature } from './hotel-standard-feature.entity';

@Entity({ name: 'hotel_standard_feature_translation' })
@Index(['hotelStandardFeatureId'])
@Index(['hotelStandardFeatureId', 'languageCode'], { unique: true })
export class HotelStandardFeatureTranslation extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_standard_feature_id', nullable: false })
  hotelStandardFeatureId: string;

  @Column({ type: 'text', name: 'language_code', nullable: false })
  languageCode: string;

  @Column({ type: 'text', name: 'name', nullable: true })
  name: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description: string;

  // Relations
  @ManyToOne(() => HotelStandardFeature, (feature) => feature.hotelStandardFeatureTranslations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotel_standard_feature_id' })
  hotelStandardFeature: HotelStandardFeature;
}