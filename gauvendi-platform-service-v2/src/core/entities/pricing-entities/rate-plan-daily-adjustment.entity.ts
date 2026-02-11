import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { NumericColumn } from '../../decorators/numeric-column.decorator';
import { RatePlan } from './rate-plan.entity';
import { Weekday } from '../../enums/common';
import { RatePlanAdjustmentType } from '../../enums/common';

@Entity({ name: 'rate_plan_daily_adjustment' })
@Index(['hotelId', 'ratePlanId', 'date'], { unique: true })
@Index(['ratePlanId'])
@Index(['hotelId', 'date'])
@Index(['hotelId', 'ratePlanId', 'date', 'dayOfWeek'])
@Index(['hotelId'])
export class RatePlanDailyAdjustment extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  @NumericColumn({ name: 'adjustment_value', precision: 26, scale: 4, nullable: true })
  adjustmentValue: string;

  @Column({
    type: 'text',
    name: 'adjustment_type',
    nullable: true,
    default: RatePlanAdjustmentType.FIXED
  })
  adjustmentType: RatePlanAdjustmentType;

  @Column({
    type: 'text',
    name: 'day_of_week',
    nullable: true,
    default: [
      Weekday.Monday,
      Weekday.Tuesday,
      Weekday.Wednesday,
      Weekday.Thursday,
      Weekday.Friday,
      Weekday.Saturday,
      Weekday.Sunday
    ],
    array: true
  })
  dayOfWeek: Weekday[];

  // relation
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanDailyAdjustments)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
