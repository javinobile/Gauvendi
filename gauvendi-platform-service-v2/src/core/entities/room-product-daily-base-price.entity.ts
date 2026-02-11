import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import { RatePlan } from './pricing-entities/rate-plan.entity';
import { RoomProduct } from './room-product.entity';

@Entity('room_product_daily_base_price')
@Index(['hotelId', 'roomProductId', 'ratePlanId', 'date'], { unique: true })
@Index(['hotelId', 'roomProductId'])
@Index(['hotelId', 'ratePlanId'])
@Index(['hotelId', 'date'])
@Index(['hotelId', 'roomProductId', 'ratePlanId'])
@Index(['hotelId', 'roomProductId', 'date'])
@Index(['hotelId', 'ratePlanId', 'date'])
@Index(['roomProductId'])
@Index(['ratePlanId'])
export class RoomProductDailyBasePrice extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  @NumericColumn({ name: 'feature_base_price', precision: 26, scale: 4, nullable: false })
  featureBasePrice: number;

  @NumericColumn({ name: 'feature_price_adjustment', precision: 26, scale: 4, nullable: false })
  featurePriceAdjustment: number;

  @NumericColumn({ name: 'base_price', precision: 26, scale: 4, nullable: false })
  basePrice: number;

  // Relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductDailyBasePrices)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.roomProductDailyBasePrices)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
