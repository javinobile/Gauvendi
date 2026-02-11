import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { RoomUnitAvailability } from './room-unit-availability.entity';

@Entity({ name: 'maintenance' })
export class Maintenance extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', nullable: true, name: 'room_unit_id' })
  roomUnitId: string | null;

  @Column({ name: 'mapping_pms_code', type: 'varchar', nullable: true })
  mappingPmsCode: string | null;

  // relations
  @OneToMany(() => RoomUnitAvailability, (roomUnitAvailability) => roomUnitAvailability.maintenance)
  roomUnitAvailabilities: RoomUnitAvailability[];
}
