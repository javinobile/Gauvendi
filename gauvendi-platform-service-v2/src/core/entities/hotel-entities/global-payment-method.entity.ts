import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntityWithTranslationsDeleted } from '../../database/entities/base.entity';
import { BookingTransaction } from '../booking-entities/booking-transaction.entity';

@Entity({ name: 'global_payment_method' })
@Index(['code'], { unique: true })
@Index(['name'])
export class GlobalPaymentMethod extends BaseEntityWithTranslationsDeleted {
  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'jsonb', nullable: true, name: 'supported_payment_provider_codes' })
  supportedPaymentProviderCodes: string[];

  @OneToMany(() => BookingTransaction, (bookingTransaction) => bookingTransaction.paymentMethod)
  bookingTransactions: BookingTransaction[];
}
