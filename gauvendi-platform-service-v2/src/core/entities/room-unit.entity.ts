import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntityWithDeleted } from '../database/entities/base.entity';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import { RoomUnitStatus } from '../enums/common';
import { RoomProductAssignedUnit } from './room-product-assigned-unit.entity';
import { RoomUnitAvailability } from './availability-entities/room-unit-availability.entity';
import { RoomUnitRetailFeature } from './room-unit-retail-feature.entity';

// Re-export enum for external use
export { RoomUnitStatus };

@Entity('room_unit')
@Index(['hotelId', 'roomNumber'])
@Index(['hotelId', 'mappingPmsCode'])
@Index(['hotelId', 'status'])
export class RoomUnit extends BaseEntityWithDeleted {
  @Column({ nullable: true, name: 'room_number', type: 'text' })
  roomNumber: string;

  @Column({ nullable: true, name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @Column({ nullable: true, name: 'mapping_pms_code', type: 'text' })
  mappingPmsCode: string;

  @Column({ nullable: true, name: 'capacity_default', type: 'integer' })
  capacityDefault: number;

  @Column({ nullable: true, name: 'maximum_adult', type: 'integer' })
  maximumAdult: number;

  @Column({ nullable: true, name: 'maximum_kid', type: 'integer' })
  maximumKid: number;

  @Column({ nullable: true, name: 'capacity_extra', type: 'integer' })
  capacityExtra: number;

  @Column({ nullable: true, name: 'extra_bed_adult', type: 'integer' })
  extraBedAdult: number;

  @Column({ nullable: true, name: 'extra_bed_kid', type: 'integer' })
  extraBedKid: number;

  @Column({ nullable: true, name: 'room_floor', type: 'text' })
  roomFloor: string;

  @Column({ nullable: true, name: 'building', type: 'text' })
  building: string;

  @Column({ nullable: true, name: 'connecting_room_id', type: 'uuid' })
  connectingRoomId: string;

  @Column({ nullable: true, name: 'number_of_bedrooms', type: 'text' })
  numberOfBedRooms: string;

  @NumericColumn({ nullable: true, name: 'space', type: 'numeric' })
  space: number;

  @Column({ nullable: true, name: 'feature_string', type: 'text' })
  featureString: string;

  @Column({ nullable: true, name: 'status', type: 'text' })
  status: RoomUnitStatus;

  @Column({ nullable: true, name: 'is_changed', type: 'boolean' })
  isChanged: boolean;

  // Relations
  @OneToMany(() => RoomUnitAvailability, (roomUnitAvailability) => roomUnitAvailability.roomUnit, {
    onDelete: 'CASCADE'
  })
  roomUnitAvailabilities: RoomUnitAvailability[];

  @OneToMany(
    () => RoomProductAssignedUnit,
    (roomProductAssignedUnit) => roomProductAssignedUnit.roomUnit,
    { onDelete: 'CASCADE' }
  )
  roomProductAssignedUnits: RoomProductAssignedUnit[];

  @OneToMany(
    () => RoomUnitRetailFeature,
    (roomUnitRetailFeature) => roomUnitRetailFeature.roomUnit,
    { onDelete: 'CASCADE' }
  )
  roomUnitRetailFeatures: RoomUnitRetailFeature[];
}
