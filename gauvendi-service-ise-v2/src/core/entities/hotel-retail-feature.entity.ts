import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithTranslations, BaseEntityWithTranslationsDeleted } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import { HotelRetailCategory } from './hotel-retail-category.entity';
import { HotelRetailFeatureTranslation } from './hotel-retail-feature-translation.entity';
import { RatePlanFeatureDailyRate } from './pricing-entities/rate-plan-feature-daily-rate.entity';
import { RoomProductRetailFeature } from './room-product-retail-feature.entity';
import { RoomUnitRetailFeature } from './room-unit-retail-feature.entity';

export enum FeatureAdultsSuitabilityEnum {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  ALL = 'ALL',
}

export enum HotelRetailFeatureStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum FeatureTypeEnum {
  AMENITY = 'AMENITY',
  SERVICE = 'SERVICE',
  FACILITY = 'FACILITY',
}

@Entity({ name: 'hotel_retail_feature' })
@Index(['hotelRetailCategoryId'])
export class HotelRetailFeature extends BaseEntityWithTranslations {
  @Column({ type: 'varchar', name: 'hotel_id', nullable: false, length: 36 })
  hotelId: string;

  @Column({ type: 'varchar', name: 'code', nullable: false })
  code: string;

  @Column({ type: 'varchar', name: 'name', nullable: false })
  name: string;

  @NumericColumn({ type: 'decimal', precision: 10, scale: 2, name: 'base_rate', nullable: true })
  baseRate: number;

  @Column({ type: 'float', name: 'base_weight', nullable: true })
  baseWeight: number;

  @Column({ type: 'boolean', name: 'children_suitability', nullable: true })
  childrenSuitability: boolean;

  @Column({
    type: 'text',
    name: 'adults_suitability',
    nullable: true,
  })
  adultsSuitability: FeatureAdultsSuitabilityEnum;

  @Column({ type: 'text', name: 'description', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'short_description', nullable: true })
  shortDescription: string;

  @Column({ type: 'integer', name: 'display_sequence', nullable: true })
  displaySequence: number;

  @Column({ type: 'varchar', name: 'mapping_feature_code', nullable: true })
  mappingFeatureCode: string;

  @Column({ type: 'boolean', name: 'is_visible', nullable: true, default: true })
  isVisible: boolean;

  @Column({
    type: 'text',
    name: 'status',
    nullable: true,
    default: HotelRetailFeatureStatusEnum.ACTIVE,
  })
  status: HotelRetailFeatureStatusEnum;

  @Column({
    type: 'text',
    name: 'type',
    nullable: true,
  })
  type: FeatureTypeEnum;

  @Column({ type: 'text', name: 'travel_tag', nullable: true, array: true })
  travelTag: string[];

  @Column({ type: 'text', name: 'occasion', nullable: true, array: true })
  occasion: string[];

  @Column({ type: 'boolean', name: 'is_multi_bedroom', nullable: true })
  isMultiBedroom: boolean;

  @Column({ type: 'boolean', name: 'is_suggested_price', nullable: true })
  isSuggestedPrice: boolean;

  @Column({ type: 'varchar', name: 'measurement_unit', nullable: true })
  measurementUnit: string;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'uuid', name: 'hotel_retail_category_id', nullable: false })
  hotelRetailCategoryId: string;

  // Relations
  @ManyToOne(() => HotelRetailCategory, (hotelRetailCategory) => hotelRetailCategory.hotelRetailFeatures)
  @JoinColumn({ name: 'hotel_retail_category_id' })
  hotelRetailCategory: HotelRetailCategory;

  @OneToMany(() => RoomProductRetailFeature, (roomProductRetailFeature) => roomProductRetailFeature.retailFeature)
  roomProductRetailFeatures: RoomProductRetailFeature[];

  @OneToMany(() => RoomUnitRetailFeature, (roomUnitRetailFeature) => roomUnitRetailFeature.retailFeature)
  roomUnitRetailFeatures: RoomUnitRetailFeature[];

  @OneToMany(
    () => HotelRetailFeatureTranslation,
    (hotelRetailFeatureTranslation) => hotelRetailFeatureTranslation.hotelRetailFeature,
  )
  hotelRetailFeatureTranslations: HotelRetailFeatureTranslation[];

  @OneToMany(() => RatePlanFeatureDailyRate, (ratePlanFeatureDailyRate) => ratePlanFeatureDailyRate.feature, { onDelete: 'CASCADE' })
  ratePlanFeatureDailyRates: RatePlanFeatureDailyRate[];
}
