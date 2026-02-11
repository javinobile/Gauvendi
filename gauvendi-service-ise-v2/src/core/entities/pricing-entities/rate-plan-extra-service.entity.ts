import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { RatePlan } from './rate-plan.entity';

export enum RatePlanExtraServiceType {
  INCLUDED = 'INCLUDED',
  EXTRA = 'EXTRA',
  MANDATORY = 'MANDATORY'
}

@Entity('rate_plan_extra_service')
@Index(['ratePlanId', 'type'])
@Index(['ratePlanId'])
@Index(['extrasId', 'ratePlanId'])
export class RatePlanExtraService extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'rate_plan_id' })
  ratePlanId: string;

  @Column({ nullable: true, name: 'extras_id', type: 'varchar', length: 36 })
  extrasId: string;

  @Column({ nullable: true, name: 'type', type: 'text' })
  type: RatePlanExtraServiceType;

  // relations
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanExtraServices)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
