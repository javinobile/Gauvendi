import { RoomProductPricingModeDto } from '@src/modules/room-product/room-product.dto';
import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import { BaseEntityWithTranslationsDeleted } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import {
  BasePriceMode,
  DistributionChannel,
  RfcAllocationSetting,
  RoomProductStatus,
  RoomProductType
} from '../enums/common';
import { RestrictionAutomationSetting } from './restriction-automation-setting.entity';
import { Restriction } from './restriction.entity';
import { RoomProductAssignedUnit } from './room-product-assigned-unit.entity';
import { RoomProductBasePriceSetting } from './room-product-base-price-setting.entity';
import { RoomProductDailyAvailability } from './availability-entities/room-product-daily-availability.entity';
import { RoomProductDailyBasePrice } from './room-product-daily-base-price.entity';
import { RoomProductDailySellingPrice } from './room-product-daily-selling-price.entity';
import { RoomProductExtraOccupancyRate } from './room-product-extra-occupancy-rate.entity';
import { RoomProductExtra } from './room-product-extra.entity';
import { RoomProductFeatureRateAdjustment } from './room-product-feature-rate-adjustment.entity';
import { RoomProductImage } from './room-product-image.entity';
import { RoomProductMappingPms } from './room-product-mapping-pms.entity';
import { RoomProductMapping } from './room-product-mapping.entity';
import { RoomProductPricingMethodDetail } from './room-product-pricing-method-detail.entity';
import { RoomProductRatePlan } from './room-product-rate-plan.entity';
import { RoomProductRetailFeature } from './room-product-retail-feature.entity';
import { RoomProductStandardFeature } from './room-product-standard-feature.entity';
import { RoomProductTypeMapping } from './room-product-type-mapping.entity';

// Re-export enum for external use
export { DistributionChannel };

@Entity('room_product')
@Index(['hotelId', 'code'], { unique: true })
@Index(['hotelId', 'distributionChannel'])
@Index(['hotelId', 'type', 'status'])
@Index(['hotelId', 'type', 'status', 'maximumAdult', 'maximumKid', 'maximumPet'])
export class RoomProduct extends BaseEntityWithTranslationsDeleted {
  @Column({ nullable: false, name: 'name', type: 'text' })
  name: string;

  @Column({ nullable: true, name: 'description', type: 'text' })
  description: string;

  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ nullable: false, name: 'code', type: 'text' })
  code: string;

  @Column({ nullable: true, name: 'rfc_allocation_setting', type: 'text' })
  rfcAllocationSetting: RfcAllocationSetting;

  @Column({ nullable: true, name: 'status', type: 'text' })
  status: RoomProductStatus;

  @Column({ nullable: true, name: 'number_of_bedrooms', type: 'integer' })
  numberOfBedrooms: number;

  @Column({ nullable: true, name: 'type', type: 'text' })
  type: RoomProductType;

  @Column({ nullable: true, name: 'extra_adult', type: 'integer' })
  extraAdult: number;

  @Column({ nullable: true, name: 'extra_children', type: 'integer' })
  extraChildren: number;

  @NumericColumn({ nullable: true, name: 'space', type: 'numeric' })
  space: number;

  @Column({ nullable: true, name: 'feature_string', type: 'text' })
  featureString: string;

  @Column({ nullable: true, name: 'capacity_default', type: 'integer' })
  capacityDefault: number;

  @Column({ nullable: true, name: 'maximum_adult', type: 'integer' })
  maximumAdult: number;

  @Column({ nullable: true, name: 'maximum_kid', type: 'integer' })
  maximumKid: number;

  @Column({ nullable: true, name: 'maximum_pet', type: 'integer' })
  maximumPet: number;

  @Column({ nullable: true, name: 'capacity_extra', type: 'integer' })
  capacityExtra: number;

  @Column({ nullable: true, name: 'extra_bed_adult', type: 'integer' })
  extraBedAdult: number;

  @Column({ nullable: true, name: 'extra_bed_kid', type: 'integer' })
  extraBedKid: number;

  @Column({ nullable: true, name: 'travel_tag', type: 'text', array: true })
  travelTag: string[];

  @Column({ nullable: true, name: 'occasion', type: 'text', array: true })
  occasion: string[];

  @Column({ nullable: true, name: 'is_sellable', type: 'boolean' })
  isSellable: boolean;

  @Column({ nullable: true, name: 'distribution_channel', type: 'text', array: true })
  distributionChannel: DistributionChannel[];

  @Column({ nullable: true, name: 'base_price_mode', type: 'text' })
  basePriceMode: BasePriceMode;

  @Column({ nullable: true, default: false, name: 'is_locked_unit', type: 'boolean' })
  isLockedUnit: boolean;

  // Geo fields (optional - for RFCs where location differs from hotel location)
  @Column({ nullable: true, name: 'latitude', type: 'varchar', length: 255 })
  latitude: string;

  @Column({ nullable: true, name: 'longitude', type: 'varchar', length: 255 })
  longitude: string;

  @Column({ nullable: true, name: 'address', type: 'varchar', length: 1000 })
  address: string;

  @Column({ nullable: true, name: 'city', type: 'varchar', length: 255 })
  city: string;

  // relations
  @OneToMany(
    () => RoomProductDailyAvailability,
    (roomProductDailyAvailability) => roomProductDailyAvailability.roomProduct,
    {
      onDelete: 'CASCADE'
    }
  )
  roomProductDailyAvailabilities: RoomProductDailyAvailability[];

  @OneToMany(() => RoomProductImage, (roomProductImage) => roomProductImage.roomProduct, {
    onDelete: 'CASCADE'
  })
  roomProductImages: RoomProductImage[];

  @OneToMany(() => RoomProductExtra, (roomProductExtra) => roomProductExtra.roomProduct, {
    onDelete: 'CASCADE'
  })
  roomProductExtras: RoomProductExtra[];

  @OneToMany(
    () => RoomProductAssignedUnit,
    (roomProductAssignedUnit) => roomProductAssignedUnit.roomProduct,
    {
      onDelete: 'CASCADE'
    }
  )
  roomProductAssignedUnits: RoomProductAssignedUnit[];

  @OneToMany(
    () => RoomProductMappingPms,
    (roomProductMappingPms) => roomProductMappingPms.roomProduct,
    { onDelete: 'CASCADE' }
  )
  roomProductMappingPms: RoomProductMappingPms[];

  @OneToMany(
    () => RoomProductRetailFeature,
    (roomProductRetailFeature) => roomProductRetailFeature.roomProduct,
    {
      onDelete: 'CASCADE'
    }
  )
  roomProductRetailFeatures: RoomProductRetailFeature[];

  @OneToMany(
    () => RoomProductStandardFeature,
    (roomProductStandardFeature) => roomProductStandardFeature.roomProduct,
    {
      onDelete: 'CASCADE'
    }
  )
  roomProductStandardFeatures: RoomProductStandardFeature[];

  @OneToMany(
    () => RoomProductTypeMapping,
    (roomProductTypeMapping) => roomProductTypeMapping.roomProduct,
    {
      onDelete: 'CASCADE'
    }
  )
  roomProductTypeMapping: RoomProductTypeMapping[];

  @OneToMany(
    () => RoomProductExtraOccupancyRate,
    (roomProductExtraOccupancyRate) => roomProductExtraOccupancyRate.roomProduct,
    {
      onDelete: 'CASCADE'
    }
  )
  roomProductExtraOccupancyRates: RoomProductExtraOccupancyRate[];

  @OneToMany(() => RoomProductRatePlan, (roomProductRatePlan) => roomProductRatePlan.roomProduct, {
    onDelete: 'CASCADE'
  })
  roomProductRatePlans: RoomProductRatePlan[];

  @OneToMany(
    () => RoomProductFeatureRateAdjustment,
    (roomProductFeatureRateAdjustment) => roomProductFeatureRateAdjustment.roomProduct,
    { onDelete: 'CASCADE' }
  )
  roomProductFeatureRateAdjustments: RoomProductFeatureRateAdjustment[];

  @OneToMany(
    () => RoomProductBasePriceSetting,
    (roomProductBasePriceSetting) => roomProductBasePriceSetting.roomProduct,
    {
      onDelete: 'CASCADE'
    }
  )
  roomProductBasePriceSettings: RoomProductBasePriceSetting[];

  @OneToMany(
    () => RoomProductDailyBasePrice,
    (roomProductDailyBasePrice) => roomProductDailyBasePrice.roomProduct,
    {
      onDelete: 'CASCADE'
    }
  )
  roomProductDailyBasePrices: RoomProductDailyBasePrice[];

  @OneToMany(
    () => RoomProductPricingMethodDetail,
    (roomProductPricingMethodDetail) => roomProductPricingMethodDetail.roomProduct,
    { onDelete: 'CASCADE' }
  )
  roomProductPricingMethodDetails: RoomProductPricingMethodDetail[];

  @OneToMany(
    () => RoomProductDailySellingPrice,
    (roomProductDailySellingPrice) => roomProductDailySellingPrice.roomProduct,
    {
      onDelete: 'CASCADE'
    }
  )
  roomProductDailySellingPrices: RoomProductDailySellingPrice[];

  @OneToMany(() => RoomProductMapping, (roomProductMapping) => roomProductMapping.roomProduct, {
    onDelete: 'CASCADE'
  })
  roomProductMappings: RoomProductMapping[];

  @OneToMany(
    () => RoomProductMapping,
    (roomProductMapping) => roomProductMapping.relatedRoomProduct,
    { onDelete: 'CASCADE' }
  )
  relatedRoomProductMapping: RoomProductMapping[];

  // for linked room product
  linkedMrfcList: RoomProduct[];

  // for automate setting
  @OneToOne(
    () => RestrictionAutomationSetting,
    (restrictionAutomationSetting) => restrictionAutomationSetting.roomProduct
  )
  roomProductRestrictionAutomateSetting?: RestrictionAutomationSetting;

  //logic
  roomProductRestrictions?: Restriction[];
  roomProductRatePlanList?: RoomProductRatePlan[];
  roomProductBasePriceSetting?: RoomProductPricingModeDto;

  // for ise recommendation
  allocatedAdultCount: number;
  allocatedChildCount: number;
  allocatedPetCount: number;
  allocatedExtraBedAdultCount: number;
  allocatedExtraBedChildCount: number;
}
