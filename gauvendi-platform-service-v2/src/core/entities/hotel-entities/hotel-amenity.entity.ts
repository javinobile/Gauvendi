import { Column, Entity, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntityWithTranslations } from '../../database/entities/base.entity';
import {
  AmenityTypeEnum,
  PricingUnitEnum,
  IsePricingDisplayModeEnum,
  AmenityAvailabilityEnum,
  AmenityStatusEnum,
  SellingTypeEnum,
  DistributionChannelEnum
} from '../../enums/common';
import { Hotel } from './hotel.entity';
import { TemplateAmenity } from './template-amenity.entity';
import { HotelAmenityPrice } from './hotel-amenity-price.entity';
import { RoomProductExtra } from '../room-product-extra.entity';
import { NumericColumn } from '../../decorators/numeric-column.decorator';
import { HotelTaxSetting } from './hotel-tax-setting.entity';
import Decimal from 'decimal.js';
import { RatePlanExtraService } from '../pricing-entities/rate-plan-extra-service.entity';

// Re-export enums for external use
export {
  AmenityTypeEnum,
  PricingUnitEnum,
  IsePricingDisplayModeEnum,
  AmenityAvailabilityEnum,
  AmenityStatusEnum,
  DistributionChannelEnum,
  SellingTypeEnum
};

@Entity({ name: 'hotel_amenity' })
@Index(['hotelId'])
@Index(['iconImageId'])
@Index(['iconImageUrl'])
@Index(['templateAmenityId'])
@Index(['amenityType'])
@Index(['status'])
@Index(['code'])
export class HotelAmenity extends BaseEntityWithTranslations {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', nullable: true, name: 'icon_image_id' })
  iconImageId: string;

  @Column({ type: 'text', nullable: true, name: 'icon_image_url' })
  iconImageUrl: string;

  @Column({ type: 'uuid', nullable: true, name: 'template_amenity_id' })
  templateAmenityId: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'description', length: 500 })
  description: string;

  @NumericColumn({ nullable: true, name: 'base_rate' })
  baseRate: number;

  @Column({ type: 'varchar', nullable: true, name: 'amenity_type', length: 60 })
  amenityType: AmenityTypeEnum;

  @Column({ type: 'varchar', nullable: true, name: 'pricing_unit', length: 60 })
  pricingUnit: PricingUnitEnum;

  @Column({ type: 'varchar', nullable: true, name: 'ise_pricing_display_mode', length: 16 })
  isePricingDisplayMode: IsePricingDisplayModeEnum;

  @Column({ type: 'varchar', nullable: true, name: 'availability', length: 60 })
  availability: AmenityAvailabilityEnum;

  @Column({ type: 'boolean', nullable: true, name: 'post_next_day' })
  postNextDay: boolean;

  @Column({ type: 'int', nullable: true, name: 'display_sequence' })
  displaySequence: number;

  @Column({ type: 'varchar', nullable: true, name: 'mapping_hotel_amenity_code', length: 60 })
  mappingHotelAmenityCode: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'status',
    length: 60,
    default: AmenityStatusEnum.ACTIVE
  })
  status: AmenityStatusEnum;

  @Column({ type: 'boolean', nullable: true, name: 'is_included', default: false })
  isIncluded: boolean;

  @Column({
    type: 'varchar',
    nullable: false,
    name: 'distribution_channel',
    array: true,
    default: () => "ARRAY['GV_SALES_ENGINE','GV_VOICE']"
  })
  distributionChannel: DistributionChannelEnum[];

  @Column({
    type: 'varchar',
    nullable: false,
    name: 'selling_type',
    length: 40,
    default: SellingTypeEnum.SINGLE
  })
  sellingType: SellingTypeEnum;

  @Column({ type: 'varchar', nullable: true, name: 'linked_amenity_code', length: 1000 })
  linkedAmenityCode: string;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @ManyToOne(() => TemplateAmenity, { nullable: true })
  @JoinColumn({ name: 'template_amenity_id' })
  templateAmenity: TemplateAmenity;

  @OneToMany(() => HotelAmenityPrice, (hotelAmenityPrice) => hotelAmenityPrice.hotelAmenity)
  hotelAmenityPrices: HotelAmenityPrice[];

  @OneToMany(() => RoomProductExtra, (roomProductExtra) => roomProductExtra.extra)
  roomProductExtras: RoomProductExtra[];

  @OneToMany(() => RatePlanExtraService, (ratePlanExtraService) => ratePlanExtraService.extra)
  ratePlanExtraServices: RatePlanExtraService[];

  //logic
  count?: number;
  taxSettingList?: HotelTaxSetting[];
  totalSellingRate?: Decimal;
  basePrice: Decimal;
  totalBaseAmount?: Decimal;
  totalSellingRateBeforeAdjustment?: Decimal;
  totalBaseAmountBeforeAdjustment?: Decimal;
  serviceChargeAmount?: Decimal;
  serviceChargeAmountBeforeAdjustment?: Decimal;
  serviceChargeRate?: Decimal;
  serviceChargeTaxRate?: Decimal;
  taxAmount?: Decimal;
  taxAmountBeforeAdjustment?: Decimal;
  totalGrossAmount?: Decimal;
  totalPrice?: Decimal;
  totalGrossAmountBeforeAdjustment?: Decimal;
  averageDailyRate?: Decimal;
  dailyPricingList?: HotelAmenityPricingDailyDto[];
  ageCategoryPricingList: HotelAmenityAgeCategoryPricingDto[];
  totalPriceBeforeAdjustment?: Decimal;
  linkedAmenityInfoList?: HotelAmenity[];
  taxDetailsMap?: Record<string, Decimal>;
  includedDates?: string[];
}

export interface HotelAmenityPricingDailyDto {
  date: string;
  price: Decimal;
  count: number;
}

export interface HotelAmenityAgeCategoryPricingDto {
  ageCategoryCode: string;
  dailyCount?: number;
  dailyPrice?: Decimal;
  totalCount?: number;
  fromAge?: number | null;
  toAge?: number | null;
  totalSellingRate?: number;
  totalPrice?: Decimal;
  count?: number;
}
