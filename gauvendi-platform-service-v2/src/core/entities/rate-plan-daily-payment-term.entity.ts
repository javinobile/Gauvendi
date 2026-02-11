import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RatePlan } from './pricing-entities/rate-plan.entity';

@Entity('rate_plan_daily_payment_term')
@Index(['hotelId', 'ratePlanId', 'date'], { unique: true })
@Index(['ratePlanId'])
@Index(['hotelId', 'date'])
@Index(['hotelId', 'ratePlanId', 'date', 'paymentTermCode'])
@Index(['hotelId'])
export class RatePlanDailyPaymentTerm extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'text', name: 'payment_term_code', nullable: false })
  paymentTermCode: string;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  // relations
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanDailyPaymentTerms)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
