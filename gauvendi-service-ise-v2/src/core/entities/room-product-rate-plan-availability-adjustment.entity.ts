import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RatePlan } from './pricing-entities/rate-plan.entity';
import { RoomProductRatePlan } from './room-product-rate-plan.entity';

@Entity('room_product_rate_plan_availability_adjustment')
@Index(['hotelId', 'roomProductRatePlanId', 'ratePlanId', 'date'], { unique: true })
@Index(['hotelId', 'roomProductRatePlanId'])
@Index(['hotelId', 'ratePlanId'])
@Index(['hotelId', 'date'])
@Index(['hotelId', 'roomProductRatePlanId', 'ratePlanId'])
@Index(['hotelId', 'roomProductRatePlanId', 'date'])
@Index(['hotelId', 'ratePlanId', 'date'])
@Index(['roomProductRatePlanId'])
@Index(['ratePlanId'])
@Index(['hotelId'])
export class RoomProductRatePlanAvailabilityAdjustment extends BaseEntity {
  @Column({ type: 'varchar', name: 'hotel_id', length: 36, nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_rate_plan_id', nullable: false })
  roomProductRatePlanId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  @Column({ type: 'boolean', name: 'is_sellable', nullable: false })
  isSellable: boolean;

  // Relations
  @ManyToOne(() => RoomProductRatePlan, (roomProductRatePlan) => roomProductRatePlan.roomProductRatePlanAvailabilityAdjustments)
  @JoinColumn({ name: 'room_product_rate_plan_id' })
  roomProductRatePlan: RoomProductRatePlan;

  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.roomProductRatePlanAvailabilityAdjustments)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
