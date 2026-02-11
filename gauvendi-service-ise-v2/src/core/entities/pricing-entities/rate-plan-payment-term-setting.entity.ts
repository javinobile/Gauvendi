import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { RatePlan } from './rate-plan.entity';

export enum SupportedPaymentMethodCodes {
  GUAINV = 'GUAINV', // Pay with invoice
  GUAWCC = 'GUAWCC', // Guarantee with credit card
  GUAWDE = 'GUAWDE', // Bank transfer
  NOGUAR = 'NOGUAR', // Reserve without credit card
  PAYPAL = 'PAYPAL', // PayPal
  PMDOTH = 'PMDOTH' // Other payment method
}

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
  @Column({ type: 'varchar', name: 'hotel_id', length: 36, nullable: false })
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
