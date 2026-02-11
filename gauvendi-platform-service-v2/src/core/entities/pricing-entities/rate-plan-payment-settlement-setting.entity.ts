import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { RatePlan } from './rate-plan.entity';
import { RatePlanPaymentSettlementSettingModeEnum } from '../../enums/common';

@Entity('rate_plan_payment_settlement_setting')
@Index(['hotelId', 'ratePlanId'], { unique: true })
@Index(['ratePlanId'])
@Index(['hotelId'])
@Index(['hotelId', 'ratePlanId', 'mode'])
@Index(['hotelId', 'mode'])
export class RatePlanPaymentSettlementSetting extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'text', name: 'mode', nullable: false })
  mode: RatePlanPaymentSettlementSettingModeEnum;

  // Relations
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanPaymentSettlementSettings)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
