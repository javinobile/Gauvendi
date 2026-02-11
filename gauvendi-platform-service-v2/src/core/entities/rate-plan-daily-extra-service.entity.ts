import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RatePlan } from './pricing-entities/rate-plan.entity';

@Entity('rate_plan_daily_extra_service')
@Index(['hotelId', 'ratePlanId', 'date'], { unique: true })
@Index(['ratePlanId'])
@Index(['hotelId', 'date'])
@Index(['hotelId', 'ratePlanId', 'date', 'extraServiceCodeList'])
@Index(['hotelId'])
export class RatePlanDailyExtraService extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'text', name: 'extra_service_code_list', nullable: false, array: true })
  extraServiceCodeList: string[];

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  // relations
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanDailyExtraServices)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
