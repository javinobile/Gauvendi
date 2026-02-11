import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Reservation } from './reservation.entity';

@Index(['reservationId'])
@Index(['roomId'])
@Index(['reservationId', 'roomId'])
@Entity({ name: 'reservation_room' })
export class ReservationRoom extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'reservation_id',
    nullable: true,
  })
  reservationId: string | null;

  @Column('uuid', {
    name: 'room_id',
    nullable: true,
  })
  roomId: string | null;

  // Relations
  @ManyToOne(() => Reservation, (reservation) => reservation.reservationRooms, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT'
  })
  @JoinColumn([{ name: 'reservation_id', referencedColumnName: 'id' }])
  reservation?: Reservation;
}
