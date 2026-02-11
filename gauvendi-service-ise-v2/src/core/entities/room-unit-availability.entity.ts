import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomUnit } from './room-unit.entity';

export enum RoomUnitAvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  OUT_OF_INVENTORY = 'OUT_OF_INVENTORY',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  BLOCKED = 'BLOCKED'
}

@Entity('room_unit_availability')
@Index(['hotelId', 'roomUnitId', 'date'], { unique: true })
@Index(['hotelId', 'roomUnitId', 'date', 'status'])
@Index(['roomUnitId'])
export class RoomUnitAvailability extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'room_unit_id' })
  roomUnitId: string;

  @Column({ nullable: true, name: 'hotel_id', type: 'varchar', length: 36 })
  hotelId: string;

  @Column({ nullable: true, name: 'date', type: 'text' })
  date: string;

  @Column({ nullable: true, name: 'status', type: 'text' })
  status: RoomUnitAvailabilityStatus;

  // relations
  @ManyToOne(() => RoomUnit, (roomUnit) => roomUnit.roomUnitAvailabilities)
  @JoinColumn({ name: 'room_unit_id' })
  roomUnit: RoomUnit;
}
