import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Currency } from '../core-entities/currency.entity';
import { Booking } from './booking.entity';
import { ReservationAmenity } from './reservation-amenity.entity';

export enum BookingTransactionStatusEnum {
  PAYMENT_PENDING = 'PENDING_PAYMENT',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED'
}

export interface IPaymentMessage {
  status: string;
  message: string;
  createdAt: Date;
}

@Index('booking_transaction_booking_id_fk', ['bookingId'], {})
@Index('booking_transaction_currency_id_index', ['currencyId'], {})
@Entity({ name: 'booking_transaction' })
export class BookingTransaction extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'booking_id',
    nullable: true
  })
  bookingId: string | null;

  @Column('uuid', {
    name: 'currency_id',
    nullable: true
  })
  currencyId: string | null;

  @Column('timestamptz', { name: 'payment_date', nullable: true })
  paymentDate: Date | null;

  @Column('varchar', { name: 'payment_mode', nullable: true, length: 60 })
  paymentMode: string | null;

  @Column('varchar', { name: 'reference_number', nullable: true, length: 60 })
  referenceNumber: string | null;

  @Column('varchar', { name: 'transaction_number', nullable: true, length: 60 })
  transactionNumber: string | null;

  @Column('varchar', { name: 'account_number', nullable: true, length: 30 })
  accountNumber: string | null;

  @Column('varchar', { name: 'account_holder', nullable: true, length: 255 })
  accountHolder: string | null;

  @Column('varchar', { name: 'expiry_month', nullable: true, length: 60 })
  expiryMonth: string | null;

  @Column('varchar', { name: 'expiry_year', nullable: true, length: 60 })
  expiryYear: string | null;

  @Column('varchar', { name: 'card_type', nullable: true, length: 60 })
  cardType: string | null;

  @Column('varchar', { name: 'status', nullable: true, length: 60 })
  status: BookingTransactionStatusEnum | null;

  @Column('decimal', {
    name: 'total_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  totalAmount: number | null;

  @Column('varchar', { name: 'payment_data', nullable: true, length: 4000 })
  paymentData: string | null;

  @Column('text', { name: 'authentication_action_data', nullable: true })
  authenticationActionData: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'payment_messages', default: '[]' })
  paymentMessages: IPaymentMessage[] | null;

  //relations
  @ManyToOne(() => Currency, (currency) => currency.id)
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @ManyToOne(() => Booking, (booking) => booking.bookingTransactions)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @OneToMany(() => ReservationAmenity, (reservation) => reservation.reservationId)
  @JoinColumn({ name: 'id' })
  reservationAmenities: ReservationAmenity;
}
