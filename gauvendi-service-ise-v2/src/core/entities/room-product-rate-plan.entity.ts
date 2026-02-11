import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import { RatePlan } from './pricing-entities/rate-plan.entity';
import { RoomProduct } from './room-product.entity';
import { RoomProductFeatureRateAdjustment } from './room-product-feature-rate-adjustment.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from './room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from './room-product-rate-plan-extra-occupancy-rate-adjustment.entity';

export enum RoomProductRatePlanGuaranteeTypeEnum {
  CREDIT_CARD = 'CREDIT_CARD',
}

export enum RoomProductRatePlanCancellationTypeEnum {
  FLEXIBLE = 'FLEXIBLE',
  NON_REFUNDABLE = 'NON_REFUNDABLE',
}

export enum ConfiguratorTypeEnum {
  PUSH_PMS = 'PUSH_PMS',
}

export enum ConfiguratorModeEnum {
  ENABLE = 'ENABLE',
  DISABLE = 'DISABLE',
}


@Entity('room_product_rate_plan')
@Index(['hotelId', 'roomProductId', 'ratePlanId'], { unique: true })
@Index(['hotelId', 'roomProductId'])
@Index(['hotelId', 'ratePlanId'])
@Index(['hotelId'])
@Index(['roomProductId'])
@Index(['ratePlanId'])
export class RoomProductRatePlan extends BaseEntity {
  @Column({ type: 'varchar', name: 'hotel_id', length: 36, nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({ type: 'text', name: 'name', nullable: false })
  name: string;

  @Column({ type: 'varchar', name: 'code', nullable: false })
  code: string;

  @Column({ type: 'text', name: 'guarantee_type', default: RoomProductRatePlanGuaranteeTypeEnum.CREDIT_CARD })
  guaranteeType: RoomProductRatePlanGuaranteeTypeEnum;

  @Column({ type: 'text', name: 'cancellation_type', default: RoomProductRatePlanCancellationTypeEnum.FLEXIBLE })
  cancellationType: RoomProductRatePlanCancellationTypeEnum;

  @NumericColumn({ name: 'total_base_rate', precision: 26, scale: 4, nullable: true })
  totalBaseRate: number;

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
    { onDelete: 'CASCADE' },
  )
  roomProductFeatureRateAdjustments: RoomProductFeatureRateAdjustment[];

  @OneToMany(
    () => RoomProductRatePlanAvailabilityAdjustment,
    (roomProductRatePlanAvailabilityAdjustment) => roomProductRatePlanAvailabilityAdjustment.roomProductRatePlan,
    { onDelete: 'CASCADE' },
  )
  roomProductRatePlanAvailabilityAdjustments: RoomProductRatePlanAvailabilityAdjustment[];

  @OneToMany(
    () => RoomProductRatePlanExtraOccupancyRateAdjustment,
    (roomProductRatePlanExtraOccupancyRateAdjustment) => roomProductRatePlanExtraOccupancyRateAdjustment.roomProductRatePlan,
    { onDelete: 'CASCADE' },
  )
  roomProductRatePlanExtraOccupancyRateAdjustments: RoomProductRatePlanExtraOccupancyRateAdjustment[];
}

export interface ConfiguratorSetting {
  type: ConfiguratorTypeEnum;
  destination: string[];
  mode: ConfiguratorModeEnum;
}