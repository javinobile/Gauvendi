import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { RatePlan } from './rate-plan.entity';
import { RatePlanExtraServiceType } from '../../enums/common';
import { HotelAmenity } from '../hotel-entities/hotel-amenity.entity';

// Re-export enum for external use
export { RatePlanExtraServiceType };


@Entity('rate_plan_extra_service')
@Index(['ratePlanId', 'type'])
@Index(['ratePlanId'])
@Index(['extrasId', 'ratePlanId'])
export class RatePlanExtraService extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'rate_plan_id' })
  ratePlanId: string;

  @Column({ nullable: true, name: 'extras_id', type: 'uuid' })
  extrasId: string;

  @Column({ nullable: true, name: 'type', type: 'text' })
  type: RatePlanExtraServiceType;

  // relations
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanExtraServices)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;

  @ManyToOne(() => HotelAmenity, (extra) => extra.ratePlanExtraServices)
  @JoinColumn({ name: 'extras_id' })
  extra: HotelAmenity;
}
// ALTER TABLE "public"."rate_plan_extra_service"
// ALTER COLUMN extras_id TYPE uuid
// USING extras_id::uuid;
