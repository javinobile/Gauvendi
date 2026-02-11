import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { DistributionChannel } from '../../enums/common';
import { RatePlan } from './rate-plan.entity';

@Entity('rate_plan_daily_sellability')
@Index(['hotelId', 'ratePlanId', 'date'])
@Index(['ratePlanId'])
@Index(['hotelId', 'date'])
@Index(['hotelId', 'ratePlanId', 'date', 'distributionChannel'], { unique: true })
@Index(['hotelId'])
export class RatePlanDailySellability extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'text', name: 'distribution_channel', nullable: false })
  distributionChannel: DistributionChannel;

  @Column({ type: 'boolean', name: 'is_sellable', nullable: false })
  isSellable: boolean;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  // Relations
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanDailySellabilities)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
