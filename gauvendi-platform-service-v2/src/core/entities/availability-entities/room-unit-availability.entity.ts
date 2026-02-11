import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { RoomUnit } from '../room-unit.entity';
import { RoomUnitAvailabilityStatus } from '../../enums/common';
import { Maintenance } from './maintenance.entity';

// Re-export enum for external use
export { RoomUnitAvailabilityStatus };

@Entity('room_unit_availability')
@Index(['hotelId', 'roomUnitId', 'date'], { unique: true })
@Index(['hotelId', 'roomUnitId', 'date', 'status'])
@Index(['roomUnitId'])
export class RoomUnitAvailability extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'room_unit_id' })
  roomUnitId: string;

  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ nullable: true, name: 'date', type: 'text' })
  date: string;

  @Column({ nullable: true, name: 'status', type: 'text' })
  status: RoomUnitAvailabilityStatus;

  @Column({ nullable: true, name: 'maintenance_id', type: 'uuid' })
  maintenanceId: string | null;

  // relations
  @ManyToOne(() => RoomUnit, (roomUnit) => roomUnit.roomUnitAvailabilities)
  @JoinColumn({ name: 'room_unit_id' })
  roomUnit: RoomUnit;

  @ManyToOne(() => Maintenance, (maintenance) => maintenance.roomUnitAvailabilities)
  @JoinColumn({ name: 'maintenance_id' })
  maintenance: Maintenance;
}
