import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Booking } from './booking.entity';

@Index(['hotelId'])
@Index(['bookingId'])
@Index(['hotelId', 'bookingId'])
@Entity({ name: 'booking_proposal_setting' })
export class BookingProposalSetting extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'hotel_id'
  })
  hotelId: string;

  @Column('uuid', {
    name: 'booking_id'
  })
  bookingId: string;

  @Column('timestamptz', { name: 'trigger_at' })
  triggerAt: Date;

  @Column('timestamptz', { name: 'valid_before' })
  validBefore: Date;

  // relation
  @OneToOne(() => Booking, (booking) => booking.bookingProposalSetting)
  @JoinColumn({ name: 'booking_id', referencedColumnName: 'id' })
  booking: Booking;
}
