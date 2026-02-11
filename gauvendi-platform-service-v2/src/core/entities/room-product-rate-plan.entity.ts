import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import {
  ConfiguratorModeEnum,
  ConfiguratorTypeEnum,
  RoomProductRatePlanCancellationTypeEnum,
  RoomProductRatePlanGuaranteeTypeEnum
} from '../enums/common';
import { RatePlan } from './pricing-entities/rate-plan.entity';
import { RoomProductFeatureRateAdjustment } from './room-product-feature-rate-adjustment.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from './room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from './room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProduct } from './room-product.entity';

@Entity('room_product_rate_plan')
@Index(['hotelId', 'roomProductId', 'ratePlanId'], { unique: true })
@Index(['hotelId', 'roomProductId'])
@Index(['hotelId', 'ratePlanId'])
@Index(['hotelId'])
@Index(['roomProductId'])
@Index(['ratePlanId'])
export class RoomProductRatePlan extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({ type: 'text', name: 'name', nullable: false })
  name: string;

  @Column({ type: 'varchar', name: 'code', nullable: false })
  code: string;

  @Column({
    type: 'text',
    name: 'guarantee_type',
    default: RoomProductRatePlanGuaranteeTypeEnum.CREDIT_CARD
  })
  guaranteeType: RoomProductRatePlanGuaranteeTypeEnum;

  @Column({
    type: 'text',
    name: 'cancellation_type',
    default: RoomProductRatePlanCancellationTypeEnum.FLEXIBLE
  })
  cancellationType: RoomProductRatePlanCancellationTypeEnum;

  @NumericColumn({ name: 'total_base_rate', precision: 26, scale: 4, nullable: true })
  totalBaseRate: number;

  @Column({ type: 'boolean', name: 'is_sellable', default: true })
  isSellable: boolean;

  @Column({ type: 'jsonb', name: 'configurator_setting', nullable: true })
  configuratorSetting: ConfiguratorSetting | null;

  isAutomatePricing: boolean;

  virtualBaseRate: number;

  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.roomProductRatePlans)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;

  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductRatePlans)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @OneToMany(
    () => RoomProductFeatureRateAdjustment,
    (roomProductFeatureRateAdjustment) => roomProductFeatureRateAdjustment.roomProductRatePlan,
    { onDelete: 'CASCADE' }
  )
  roomProductFeatureRateAdjustments: RoomProductFeatureRateAdjustment[];

  @OneToMany(
    () => RoomProductRatePlanAvailabilityAdjustment,
    (roomProductRatePlanAvailabilityAdjustment) =>
      roomProductRatePlanAvailabilityAdjustment.roomProductRatePlan,
    { onDelete: 'CASCADE' }
  )
  roomProductRatePlanAvailabilityAdjustments: RoomProductRatePlanAvailabilityAdjustment[];

  @OneToMany(
    () => RoomProductRatePlanExtraOccupancyRateAdjustment,
    (roomProductRatePlanExtraOccupancyRateAdjustment) =>
      roomProductRatePlanExtraOccupancyRateAdjustment.roomProductRatePlan,
    { onDelete: 'CASCADE' }
  )
  roomProductRatePlanExtraOccupancyRateAdjustments: RoomProductRatePlanExtraOccupancyRateAdjustment[];
}

export interface ConfiguratorSetting {
  type: ConfiguratorTypeEnum;
  destination: string[];
  lastPushedAt?: string;
  mode: ConfiguratorModeEnum;
}
