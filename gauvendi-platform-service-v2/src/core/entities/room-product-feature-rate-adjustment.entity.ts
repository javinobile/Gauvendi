import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import { RoomProductRatePlan } from './room-product-rate-plan.entity';
import { RoomProductRetailFeature } from './room-product-retail-feature.entity';
import { RoomProduct } from './room-product.entity';

@Entity('room_product_feature_rate_adjustment')
@Index(['hotelId', 'roomProductId', 'featureId', 'roomProductRatePlanId', 'date'], { unique: true })
@Index(['hotelId', 'roomProductId', 'featureId'])
@Index(['hotelId', 'roomProductRatePlanId'])
@Index(['hotelId', 'date'])
@Index(['hotelId', 'roomProductId', 'featureId', 'roomProductRatePlanId'])
@Index(['hotelId', 'roomProductId', 'featureId', 'date'])
@Index(['hotelId', 'roomProductRatePlanId', 'date'])
@Index(['roomProductId'])
@Index(['hotelId'])
@Index(['featureId'])
@Index(['roomProductRatePlanId'])
@Index(['featureId', 'roomProductRatePlanId'])
export class RoomProductFeatureRateAdjustment extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({ type: 'uuid', name: 'feature_id', nullable: false })
  featureId: string;

  @Column({ type: 'uuid', name: 'room_product_rate_plan_id', nullable: false })
  roomProductRatePlanId: string;

  @NumericColumn({ name: 'rate_adjustment', precision: 26, scale: 4, nullable: false })
  rateAdjustment: number;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  @NumericColumn({ name: 'rate_original', precision: 26, scale: 4, nullable: false })
  rateOriginal: number;

  // Relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductFeatureRateAdjustments)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @ManyToOne(
    () => RoomProductRatePlan,
    (roomProductRatePlan) => roomProductRatePlan.roomProductFeatureRateAdjustments
  )
  @JoinColumn({ name: 'room_product_rate_plan_id' })
  roomProductRatePlan: RoomProductRatePlan;

  @ManyToOne(
    () => RoomProductRetailFeature,
    (roomProductRetailFeature) => roomProductRetailFeature.roomProductFeatureRateAdjustments
  )
  @JoinColumn({ name: 'feature_id' })
  roomProductRetailFeature: RoomProductRetailFeature;
}
