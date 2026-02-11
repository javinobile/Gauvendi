import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import { RoomProductRatePlan } from './room-product-rate-plan.entity';

@Entity('room_product_rate_plan_extra_occupancy_rate_adjustment')
@Index(['hotelId', 'roomProductRatePlanId', 'extraPeople', 'date'], { unique: true })
@Index(['hotelId', 'roomProductRatePlanId'])
@Index(['hotelId', 'extraPeople'])
@Index(['hotelId', 'date'])
@Index(['hotelId', 'roomProductRatePlanId', 'extraPeople'])
@Index(['hotelId', 'roomProductRatePlanId', 'date'])
@Index(['hotelId', 'extraPeople', 'date'])
@Index(['roomProductRatePlanId'])
@Index(['extraPeople'])
@Index(['hotelId'])
export class RoomProductRatePlanExtraOccupancyRateAdjustment extends BaseEntity {
  @Column({ type: 'varchar', name: 'hotel_id', length: 36, nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_rate_plan_id', nullable: false })
  roomProductRatePlanId: string;

  @Column({ type: 'integer', name: 'extra_people', nullable: false })
  extraPeople: number;

  @NumericColumn({ name: 'extra_rate', precision: 26, scale: 4, nullable: false })
  extraRate: string;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  // Relations
  @ManyToOne(
    () => RoomProductRatePlan,
    (roomProductRatePlan) => roomProductRatePlan.roomProductRatePlanExtraOccupancyRateAdjustments,
  )
  @JoinColumn({ name: 'room_product_rate_plan_id' })
  roomProductRatePlan: RoomProductRatePlan;
}
