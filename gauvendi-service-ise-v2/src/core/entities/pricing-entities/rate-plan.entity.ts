import { RatePlanAdjustmentType } from 'src/core/enums/common';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import {
  BaseEntityWithTranslations,
  BaseEntityWithTranslationsDeleted
} from '../../database/entities/base.entity';
import { NumericColumn } from '../../decorators/numeric-column.decorator';
import {
  CancellationFeeUnitEnum,
  CancellationPolicyDisplayUnitEnum,
  HotelCancellationPolicy
} from '../hotel-entities/hotel-cancellation-policy.entity';
import { RatePlanCxlPolicyDaily } from '../rate-plan-cxl-policy-daily.entity';
import { RatePlanDailyExtraService } from '../rate-plan-daily-extra-service.entity';
import { RatePlanDailyPaymentTerm } from '../rate-plan-daily-payment-term.entity';
import { RoomProductDailyBasePrice } from '../room-product-daily-base-price.entity';
import { RoomProductDailySellingPrice } from '../room-product-daily-selling-price.entity';
import { RoomProductPricingMethodDetail } from '../room-product-pricing-method-detail.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '../room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlan } from '../room-product-rate-plan.entity';
import { DistributionChannel } from '../room-product.entity';
import { RatePlanDailyAdjustment } from './rate-plan-daily-adjustment.entity';
import { RatePlanDailySellability } from './rate-plan-daily-sellability.entity';
import { RatePlanDerivedSetting } from './rate-plan-derived-setting.entity';
import { RatePlanExtraService } from './rate-plan-extra-service.entity';
import { RatePlanFeatureDailyRate } from './rate-plan-feature-daily-rate.entity';
import { RatePlanPaymentSettlementSetting } from './rate-plan-payment-settlement-setting.entity';
import { RatePlanPaymentTermSetting } from './rate-plan-payment-term-setting.entity';
import { RatePlanSellability } from './rate-plan-sellability.entity';

export enum RatePlanPricingMethodologyEnum {
  FEATURE_BASED_PRICING = 'FEATURE_BASED_PRICING',
  DERIVED_PRICING = 'DERIVED_PRICING'
}

export enum RatePlanStatusEnum {
  ACTIVE = 'ACTIVE',
  ARCHIVE = 'ARCHIVE'
}

export enum RoundingModeEnum {
  DOWN = 'DOWN',
  HALF_ROUND_UP = 'HALF_ROUND_UP',
  NO_ROUNDING = 'NO_ROUNDING',
  UP = 'UP'
}

export enum RatePlanTypeEnum {
  PUBLIC = 'PUBLIC',
  PROMOTION = 'PROMOTION',
  CORPORATE = 'CORPORATE',
  GROUP = 'GROUP',
  BUNDLE = 'BUNDLE'
}

export enum SellingStrategyTypeEnum {
  DEFAULT = 'DEFAULT',
  LONG_STAY = 'LONG_STAY'
}

@Entity('rate_plan')
@Index(['hotelId', 'code'])
@Index(['hotelId'])
@Index(['hotelId', 'status'])
@Index(['hotelId', 'distributionChannel'])
@Index(['hotelId', 'type'])
export class RatePlan extends BaseEntityWithTranslationsDeleted {
  @Column({ type: 'varchar', name: 'hotel_id', length: 36, nullable: false })
  hotelId: string;

  @Column({ type: 'text', name: 'name', nullable: false })
  name: string;

  @Column({ type: 'text', name: 'code', nullable: false })
  code: string;

  @Column({
    type: 'text',
    name: 'pricing_methodology',
    nullable: true,
    default: RatePlanPricingMethodologyEnum.FEATURE_BASED_PRICING
  })
  pricingMethodology: RatePlanPricingMethodologyEnum;

  @Column({ type: 'integer', name: 'hour_prior', nullable: true, default: 0 })
  hourPrior: number;

  @Column({
    type: 'text',
    name: 'display_unit',
    nullable: true,
    default: CancellationPolicyDisplayUnitEnum.DAY
  })
  displayUnit: CancellationPolicyDisplayUnitEnum;

  @NumericColumn({ name: 'cancellation_fee_value', precision: 26, scale: 4, nullable: true })
  cancellationFeeValue?: number;

  @Column({
    type: 'text',
    name: 'cancellation_fee_unit',
    nullable: true,
    default: CancellationFeeUnitEnum.PERCENTAGE
  })
  cancellationFeeUnit: CancellationFeeUnitEnum;

  @Column({ type: 'text', name: 'hotel_cxl_policy_code', nullable: true })
  hotelCxlPolicyCode?: string;

  @Column({ type: 'text', name: 'payment_term_code', nullable: true })
  paymentTermCode?: string;

  @NumericColumn({ name: 'pay_at_hotel', precision: 26, scale: 4, nullable: true })
  payAtHotel?: number;

  @NumericColumn({ name: 'pay_on_confirmation', precision: 26, scale: 4, nullable: true })
  payOnConfirmation?: number;

  @Column({ type: 'text', name: 'description', nullable: true })
  description?: string;

  @Column({
    type: 'text',
    name: 'rounding_mode',
    nullable: true,
    default: RoundingModeEnum.NO_ROUNDING
  })
  roundingMode: RoundingModeEnum;

  @Column({
    type: 'text',
    name: 'status',
    nullable: true,
    default: RatePlanStatusEnum.ACTIVE
  })
  status: RatePlanStatusEnum;

  @Column({ type: 'text', name: 'pms_mapping_rate_plan_code', nullable: true })
  pmsMappingRatePlanCode?: string;

  @Column({
    type: 'text',
    name: 'type',
    nullable: true,
    default: RatePlanTypeEnum.PUBLIC
  })
  type: RatePlanTypeEnum;

  @Column({ type: 'text', name: 'promo_codes', nullable: true, array: true })
  promoCodes: string[];

  @Column({ name: 'is_primary', type: 'boolean', nullable: true, default: false })
  isPrimary: boolean;

  @Column({
    type: 'text',
    name: 'distribution_channel',
    nullable: true,
    array: true,
    default: ['GV_SALES_ENGINE', 'GV_VOICE']
  })
  distributionChannel: DistributionChannel[];

  @Column({ name: 'rfc_attribute_mode', type: 'boolean', nullable: true, default: false })
  rfcAttributeMode: boolean;

  @Column({ name: 'mrfc_positioning_mode', type: 'boolean', nullable: true, default: false })
  mrfcPositioningMode: boolean;

  @Column({ type: 'text', name: 'hotel_extras_code_list', nullable: true })
  hotelExtrasCodeList: string;

  @NumericColumn({ name: 'adjustment_value', precision: 26, scale: 4, nullable: true })
  adjustmentValue?: number;

  @Column({
    type: 'text',
    name: 'adjustment_unit',
    nullable: true,
    default: RatePlanAdjustmentType.FIXED
  })
  adjustmentUnit: RatePlanAdjustmentType | null;

  @Column({
    type: 'text',
    name: 'selling_strategy_type',
    nullable: true,
    default: SellingStrategyTypeEnum.DEFAULT
  })
  sellingStrategyType: SellingStrategyTypeEnum;

  @Column({ type: 'text', name: 'market_segment_id', nullable: true })
  marketSegmentId?: string;

  // relation
  @OneToMany(
    () => RatePlanDailyAdjustment,
    (ratePlanDailyAdjustment) => ratePlanDailyAdjustment.ratePlan,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'id' })
  ratePlanDailyAdjustments: RatePlanDailyAdjustment[];

  @OneToMany(() => RatePlanDerivedSetting, (setting) => setting.derivedRatePlan, {
    onDelete: 'CASCADE'
  })
  derivedSetting: RatePlanDerivedSetting[];

  @OneToMany(() => RatePlanDerivedSetting, (setting) => setting.ratePlan, { onDelete: 'CASCADE' })
  baseSetting: RatePlanDerivedSetting[];

  @OneToMany(
    () => RatePlanFeatureDailyRate,
    (ratePlanFeatureDailyRate) => ratePlanFeatureDailyRate.ratePlan,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'id' })
  ratePlanFeatureDailyRates: RatePlanFeatureDailyRate[];

  @OneToMany(() => RoomProductRatePlan, (roomProductRatePlan) => roomProductRatePlan.ratePlan, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'id' })
  roomProductRatePlans: RoomProductRatePlan[];

  @OneToMany(
    () => RoomProductRatePlanAvailabilityAdjustment,
    (roomProductRatePlanAvailabilityAdjustment) =>
      roomProductRatePlanAvailabilityAdjustment.ratePlan,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'id' })
  roomProductRatePlanAvailabilityAdjustments: RoomProductRatePlanAvailabilityAdjustment[];

  @OneToMany(
    () => RoomProductDailyBasePrice,
    (roomProductDailyBasePrice) => roomProductDailyBasePrice.ratePlan,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'id' })
  roomProductDailyBasePrices: RoomProductDailyBasePrice[];

  @OneToMany(
    () => RoomProductPricingMethodDetail,
    (roomProductPricingMethodDetail) => roomProductPricingMethodDetail.ratePlan,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'id' })
  roomProductPricingMethodDetails: RoomProductPricingMethodDetail[];

  @OneToMany(
    () => RatePlanPaymentSettlementSetting,
    (ratePlanPaymentSettlementSetting) => ratePlanPaymentSettlementSetting.ratePlan,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'id' })
  ratePlanPaymentSettlementSettings: RatePlanPaymentSettlementSetting[];

  @OneToMany(
    () => RatePlanPaymentTermSetting,
    (ratePlanPaymentTermSetting) => ratePlanPaymentTermSetting.ratePlan,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'id' })
  ratePlanPaymentTermSettings: RatePlanPaymentTermSetting[];

  @OneToMany(() => RatePlanSellability, (ratePlanSellability) => ratePlanSellability.ratePlan, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'id' })
  ratePlanSellabilities: RatePlanSellability[];

  @OneToMany(
    () => RatePlanDailySellability,
    (ratePlanDailySellability) => ratePlanDailySellability.ratePlan,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'id' })
  ratePlanDailySellabilities: RatePlanDailySellability[];

  @OneToMany(() => RatePlanExtraService, (ratePlanExtraService) => ratePlanExtraService.ratePlan, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'id' })
  ratePlanExtraServices: RatePlanExtraService[];

  @OneToMany(
    () => RatePlanDailyExtraService,
    (ratePlanDailyExtraService) => ratePlanDailyExtraService.ratePlan,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'id' })
  ratePlanDailyExtraServices: RatePlanDailyExtraService[];

  @OneToMany(
    () => RatePlanDailyPaymentTerm,
    (ratePlanDailyPaymentTerm) => ratePlanDailyPaymentTerm.ratePlan,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'id' })
  ratePlanDailyPaymentTerms: RatePlanDailyPaymentTerm[];

  @OneToMany(
    () => RatePlanCxlPolicyDaily,
    (ratePlanCxlPolicyDaily) => ratePlanCxlPolicyDaily.ratePlan,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'id' })
  ratePlanCxlPolicyDaily: RatePlanCxlPolicyDaily[];

  @ManyToOne(() => HotelCancellationPolicy, { nullable: true })
  @JoinColumn({ name: 'hotel_cxl_policy_code', referencedColumnName: 'code' })
  hotelCancellationPolicy: HotelCancellationPolicy;

  @OneToMany(
    () => RoomProductDailySellingPrice,
    (roomProductDailySellingPrice) => roomProductDailySellingPrice.ratePlan,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'id' })
  roomProductDailySellingPrices: RoomProductDailySellingPrice[];

  // logic
  salesPlanFollowList: RatePlan[];
}
