import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import { RatePlan } from './pricing-entities/rate-plan.entity';
import { RoomProduct } from './room-product.entity';

export enum RoomProductPricingMethodEnum {
  DERIVED = 'DERIVED',
  LINK = 'LINK',
  PRODUCT_BASED_PRICING = 'PRODUCT_BASED_PRICING',
  PMS_PRICING = 'PMS_PRICING',
}

export enum RoomProductPricingMethodAdjustmentUnitEnum {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}


@Entity('room_product_pricing_method_detail')
@Index(['hotelId', 'roomProductId', 'ratePlanId'], { unique: true })
@Index(['hotelId', 'roomProductId'])
@Index(['hotelId', 'ratePlanId'])
@Index(['hotelId'])
@Index(['roomProductId'])
@Index(['ratePlanId'])
export class RoomProductPricingMethodDetail extends BaseEntity {
  @Column({ type: 'varchar', name: 'hotel_id', length: 36, nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'text', name: 'pricing_method', nullable: false })
  pricingMethod: RoomProductPricingMethodEnum;

  @NumericColumn({ name: 'pricing_method_adjustment_value', precision: 26, scale: 4, nullable: true })
  pricingMethodAdjustmentValue: number;

  @Column({ type: 'text', name: 'pricing_method_adjustment_unit', nullable: true })
  pricingMethodAdjustmentUnit: RoomProductPricingMethodAdjustmentUnitEnum;

  // Nullable depending on type
  @Column({ type: 'uuid', name: 'mapping_room_product_id', nullable: true })
  mappingRoomProductId: string;

  @Column({ type: 'uuid', name: 'target_rate_plan_id', nullable: true })
  targetRatePlanId: string;

  @Column({ type: 'uuid', name: 'target_room_product_id', nullable: true })
  targetRoomProductId: string;

  @Column({ type: 'text', name: 'pms_rate_plan_code', nullable: true })
  pmsRatePlanCode: string;


  // Relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductPricingMethodDetails)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.roomProductPricingMethodDetails)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
