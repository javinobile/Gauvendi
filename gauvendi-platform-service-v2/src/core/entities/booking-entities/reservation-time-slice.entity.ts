import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Reservation } from './reservation.entity';

@Index(['reservationId'])
@Index(['roomId'])
@Index(['roomProductId'])
@Index(['reservationId', 'roomId'])
@Index(['reservationId', 'roomProductId'])
@Index(['roomId', 'roomProductId'])
@Index(['reservationId', 'roomId', 'roomProductId'])
@Entity({ name: 'reservation_time_slice' })
export class ReservationTimeSlice extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'room_id',
    nullable: true
  })
  roomId: string | null;

  @Column('uuid', {
    name: 'reservation_id',
    nullable: true
  })
  reservationId: string | null;

  @Column('uuid', {
    name: 'room_product_id',
    nullable: true
  })
  roomProductId: string | null;

  @Column('bigint', { name: 'millisec_from_time', nullable: true })
  millisecFromTime: string | null;

  @Column('bigint', { name: 'millisec_to_time', nullable: true })
  millisecToTime: string | null;

  @Column('decimal', {
    name: 'total_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  totalBaseAmount: number | null;

  @Column('decimal', {
    name: 'total_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  totalGrossAmount: number | null;

  @Column('decimal', {
    name: 'tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  taxAmount: number | null;

  @Column('decimal', {
    name: 'service_charge_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  serviceChargeAmount: number | null;

  @Column('boolean', { name: 'is_locked', nullable: true, default: false })
  isLocked: boolean | null;

  @Column('timestamptz', { name: 'from_time', nullable: true })
  fromTime: Date | null;

  @Column('timestamptz', { name: 'to_time', nullable: true })
  toTime: Date | null;

  @ManyToOne(() => Reservation, (reservation) => reservation.reservationTimeSlices, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT'
  })
  @JoinColumn([{ name: 'reservation_id', referencedColumnName: 'id' }])
  reservation?: Reservation;
}
