import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { BookingMetaTracking } from './booking-meta-tracking.entity';
import { BookingTransaction } from './booking-transaction.entity';
import { Guest } from './guest.entity';
import { Reservation } from './reservation.entity';

@Index('idx_bookingNumber', ['bookingNumber'], {})
@Index('idx_hotelId_bookingNumber', ['hotelId', 'bookingNumber'], {})
@Index(['bookerId'])
@Entity({ name: 'booking' })
export class Booking extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'hotel_id',
    nullable: true
  })
  hotelId: string | null;

  @Column('varchar', { name: 'booking_number', nullable: true, length: 60 })
  bookingNumber: string | null;

  @Column('varchar', {
    name: 'mapping_booking_code',
    nullable: true,
    length: 4000
  })
  mappingBookingCode: string | null;

  @Column('varchar', {
    name: 'mapping_channel_booking_code',
    nullable: true,
    length: 100
  })
  mappingChannelBookingCode: string | null;

  @Column('timestamptz', { name: 'completed_date', nullable: true })
  completedDate: Date | null;

  @Column('timestamptz', { name: 'hold_expired_date', nullable: true })
  holdExpiredDate: Date | null;

  @Column('uuid', {
    name: 'booker_id',
    nullable: true
  })
  bookerId: string | null;

  @Column('varchar', { name: 'special_request', nullable: true, length: 4000 })
  specialRequest: string | null;

  @Column('boolean', {
    name: 'accept_tnc',
    nullable: true,
    default: false
  })
  acceptTnc: boolean | null;

  @Column('boolean', {
    name: 'is_book_for_someone_else',
    nullable: true,
    default: false
  })
  isBookForSomeoneElse: boolean | null;

  @Column('boolean', {
    name: 'is_confirmation_email_sent',
    nullable: true,
    default: false
  })
  isConfirmationEmailSent: boolean | null;

  @OneToMany(() => Reservation, (reservation) => reservation.booking)
  reservations: Reservation[];

  @ManyToOne(() => Guest, (booker) => booker)
  @JoinColumn({ name: 'booker_id' })
  booker: Guest;

  @OneToMany(() => BookingTransaction, (transaction) => transaction.booking)
  bookingTransactions: BookingTransaction[];

  @OneToOne(() => BookingMetaTracking, (metaTracking) => metaTracking.booking)
  metaTracking: BookingMetaTracking;
}
