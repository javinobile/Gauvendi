import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import { RatePlan } from './pricing-entities/rate-plan.entity';
import { RoomProduct } from './room-product.entity';

@Entity('room_product_daily_selling_price')
@Index(['hotelId', 'roomProductId', 'ratePlanId', 'date'], { unique: true })
@Index(['roomProductId'])
@Index(['ratePlanId'])
@Index(['hotelId', 'roomProductId'])
@Index(['ratePlanId', 'hotelId', 'date'])
export class RoomProductDailySellingPrice extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  // Pricing breakdown for transparency and debugging
  @NumericColumn({ name: 'base_price', precision: 26, scale: 4, nullable: false })
  basePrice: number;

  @NumericColumn({
    name: 'feature_adjustments',
    precision: 26,
    scale: 4,
    nullable: false,
    default: 0
  })
  featureAdjustments: number;

  @NumericColumn({
    name: 'rate_plan_adjustments',
    precision: 26,
    scale: 4,
    nullable: false,
    default: 0
  })
  ratePlanAdjustments: number;

  // @NumericColumn({ name: 'occupancy_surcharges', precision: 26, scale: 4, nullable: false, default: 0 })
  // occupancySurcharges: number;

  // @NumericColumn({ name: 'extra_service_charges', precision: 26, scale: 4, nullable: false, default: 0 })
  // extraServiceCharges: number;

  // Final computed prices
  @NumericColumn({ name: 'net_price', precision: 26, scale: 4, nullable: false })
  netPrice: number;

  @NumericColumn({ name: 'gross_price', precision: 26, scale: 4, nullable: false })
  grossPrice: number;

  // Tax amount
  @NumericColumn({ name: 'tax_amount', precision: 26, scale: 4, nullable: false, default: 0 })
  taxAmount: number;

  // Metadata for cache management
  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata: any;

  // Relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductDailySellingPrices)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.roomProductDailySellingPrices)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
