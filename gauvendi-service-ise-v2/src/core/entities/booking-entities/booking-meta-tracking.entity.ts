import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Booking } from './booking.entity';

@Entity({ name: 'booking_meta_tracking' })
export class BookingMetaTracking extends BaseEntity {
  @Column('uuid', { name: 'booking_id', nullable: false })
  bookingId: string;

  @Column('varchar', { name: 'user_agent', nullable: true, length: 1000 })
  userAgent: string | null;

  @Column('varchar', { name: 'browser_ip', nullable: true, length: 100 })
  browserIp: string | null;

  @Column('varchar', { name: 'fbp', nullable: true, length: 255 })
  fbp: string | null; // Facebook Pixel cookie (_fbp)

  @Column('varchar', { name: 'fbc', nullable: true, length: 255 })
  fbc: string | null; // Facebook Click ID cookie (_fbc)

  @OneToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}
