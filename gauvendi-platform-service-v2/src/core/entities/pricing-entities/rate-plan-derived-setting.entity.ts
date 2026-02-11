import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { RatePlan } from './rate-plan.entity';
import { RatePlanDerivedSettingInheritedFields } from '@src/core/enums/common';

@Entity({ name: 'rate_plan_derived_setting' })
@Index(['hotelId', 'ratePlanId'])
@Index(['ratePlanId'])
@Index(['hotelId'])
@Index(['hotelId', 'ratePlanId', 'derivedRatePlanId'])
@Index(['hotelId', 'derivedRatePlanId'])
export class RatePlanDerivedSetting extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'uuid', name: 'derived_rate_plan_id', nullable: false })
  derivedRatePlanId: string;

  @Column({ name: 'follow_daily_payment_term', type: 'boolean', default: false })
  followDailyPaymentTerm: boolean;

  @Column({ name: 'follow_daily_cxl_policy', type: 'boolean', default: false })
  followDailyCxlPolicy: boolean;

  @Column({ name: 'follow_daily_included_amenity', type: 'boolean', default: false })
  followDailyIncludedAmenity: boolean;

  @Column({ name: 'follow_daily_room_product_availability', type: 'boolean', default: false })
  followDailyRoomProductAvailability: boolean;

  @Column({ name: 'follow_daily_restriction', type: 'boolean', default: false })
  followDailyRestriction: boolean;

  @Column({
    name: 'inherited_restriction_fields',
    type: 'varchar',
    array: true,
    default: () => `ARRAY[
      'minLength',
      'maxLength',
      'minAdv',
      'maxAdv',
      'minLosThrough',
      'maxReservationCount'
    ]::varchar[]`,
    nullable: true
  })
  inheritedRestrictionFields: RatePlanDerivedSettingInheritedFields[];

  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.derivedSetting)
  @JoinColumn({ name: 'derived_rate_plan_id' })
  derivedRatePlan: RatePlan;

  @OneToOne(() => RatePlan, (ratePlan) => ratePlan.baseSetting)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
