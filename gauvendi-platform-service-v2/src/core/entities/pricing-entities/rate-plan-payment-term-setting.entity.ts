import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { SupportedPaymentMethodCodes } from '../../enums/common';
import { RatePlan } from './rate-plan.entity';

// Re-export enum for external use
export { SupportedPaymentMethodCodes };

@Entity('rate_plan_payment_term_setting')
@Index(['hotelId', 'ratePlanId'])
@Index(['hotelId', 'ratePlanId', 'isDefault'])
@Index(['ratePlanId'])
@Index(['hotelId'])
@Index(['hotelId', 'ratePlanId', 'hotelPaymentTermId'], { unique: true })
@Index(['hotelId', 'hotelPaymentTermId'])
@Index(['hotelId', 'ratePlanId', 'hotelPaymentTermId', 'supportedPaymentMethodCodes'])
@Index(['hotelId', 'supportedPaymentMethodCodes'])
export class RatePlanPaymentTermSetting extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'varchar', name: 'hotel_payment_term_id', length: 36, nullable: false })
  hotelPaymentTermId: string;

  @Column({ type: 'text', name: 'supported_payment_method_codes', nullable: true, array: true })
  supportedPaymentMethodCodes: SupportedPaymentMethodCodes[];

  @Column({ type: 'boolean', name: 'is_default', nullable: false, default: false })
  isDefault: boolean;

  // Relations
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanPaymentTermSettings)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
