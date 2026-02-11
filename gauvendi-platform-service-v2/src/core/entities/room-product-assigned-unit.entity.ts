import { Entity, Column, JoinColumn, ManyToOne, Index } from 'typeorm';
import { RoomProduct } from './room-product.entity';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomUnit } from './room-unit.entity';

@Entity('room_product_assigned_unit')
@Index(['roomProductId', 'roomUnitId'], { unique: true })
@Index(['roomProductId'])
@Index(['roomUnitId'])
export class RoomProductAssignedUnit extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'room_product_id' })
  roomProductId: string;

  @Column({ type: 'uuid', nullable: false, name: 'room_unit_id' })
  roomUnitId: string;

  // relations
  @ManyToOne(() => RoomProduct, (product) => product.roomProductAssignedUnits, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @ManyToOne(() => RoomUnit, (roomUnit) => roomUnit.roomProductAssignedUnits)
  @JoinColumn({ name: 'room_unit_id' })
  roomUnit: RoomUnit;
}
