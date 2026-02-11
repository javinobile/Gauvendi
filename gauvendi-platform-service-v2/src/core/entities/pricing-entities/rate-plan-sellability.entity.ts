import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { DistributionChannel } from '../../enums/common';
import { RatePlan } from './rate-plan.entity';

@Entity('rate_plan_sellability')
@Index(['hotelId', 'ratePlanId', 'distributionChannel'])
@Index(['hotelId', 'ratePlanId'], { unique: true })
@Index(['hotelId'])
export class RatePlanSellability extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({
    type: 'text',
    name: 'distribution_channel',
    nullable: true,
    array: true,
    default: ['GV_SALES_ENGINE', 'GV_VOICE']
  })
  distributionChannel: DistributionChannel[];

  // Relations
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanSellabilities)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
