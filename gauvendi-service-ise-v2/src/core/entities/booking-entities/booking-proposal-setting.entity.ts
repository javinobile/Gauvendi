import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

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
}
