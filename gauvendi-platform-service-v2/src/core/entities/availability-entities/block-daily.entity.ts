import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { GroupBooking } from './group-booking.entity';

export enum BlockStatus {
  TENTATIVE = 'Tentative',
  DEFINITE = 'Definite',
  CANCELED = 'Canceled'
}

@Index(['roomProductId', 'date', 'hotelId'])
@Index(['groupBookingId', 'hotelId'])
@Index(['mappingPmsCode', 'hotelId'])
@Index(['blockId', 'hotelId'])
@Entity('block_daily')
export class BlockDaily extends BaseEntityWithDeleted {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', nullable: false, name: 'block_id' })
  blockId: string;

  @Column({ type: 'uuid', nullable: false })
  roomProductId: string;

  // definitely block units
  @Column({ nullable: true, name: 'definitely_block', type: 'integer' })
  definitelyBlock: number;

  // tentatively block units
  @Column({ nullable: true, name: 'tentatively_block', type: 'integer' })
  tentativelyBlock: number;

  // picked units
  @Column({ nullable: true, name: 'picked_units', type: 'integer' })
  pickedUnits: number;

  @Column({ nullable: false, name: 'date', type: 'text' })
  date: string;

  @Column({ type: 'enum', enum: BlockStatus })
  status: BlockStatus;

  @Column({ type: 'varchar', nullable: true })
  mappingPmsCode: string;

  @Column({ type: 'uuid', nullable: false })
  groupBookingId: string;

  @ManyToOne(() => GroupBooking, (g) => g.blocks, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'group_booking_id' })
  groupBooking: GroupBooking;
}
