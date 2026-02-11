import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntityWithTranslations } from '../database/entities/base.entity';
import { HotelStandardFeatureTranslation } from './hotel-standard-feature-translation.entity';
import { RoomProductStandardFeature } from './room-product-standard-feature.entity';

@Entity({ name: 'hotel_standard_feature' })
@Index(['hotelId'])
@Index(['hotelId', 'code'])
export class HotelStandardFeature extends BaseEntityWithTranslations {
  @Column({ type: 'varchar', name: 'hotel_id', nullable: false, length: 36 })
  hotelId: string;

  @Column({ type: 'text', name: 'code', nullable: false })
  code: string;

  @Column({ type: 'text', name: 'name', nullable: false })
  name: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'short_description', nullable: true })
  shortDescription: string;

  @Column({ type: 'text', name: 'mapping_feature_code', nullable: true })
  mappingFeatureCode: string;

  @Column({ type: 'integer', name: 'display_sequence', nullable: true })
  displaySequence: number;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl: string;

  // Relations
  @OneToMany(() => RoomProductStandardFeature, (roomProductStandardFeature) => roomProductStandardFeature.standardFeature)
  roomProductStandardFeatures: RoomProductStandardFeature[];

  @OneToMany(
    () => HotelStandardFeatureTranslation,
    (hotelStandardFeatureTranslation) => hotelStandardFeatureTranslation.hotelStandardFeature,
    { cascade: true }
  )
  hotelStandardFeatureTranslations: HotelStandardFeatureTranslation[];
}
