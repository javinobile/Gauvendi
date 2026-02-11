import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('flexi_room_type')
export class FlexiRoomType extends BaseEntity {
  @Column({ type: 'uuid', name: 'flexi_hotel_id' })
  flexiHotelId: string;

  @Column({ name: 'room_product_id', type: 'uuid' })
  roomProductId: string; // GV

  @Column({ name: 'code', type: 'varchar', length: 255 })
  code: string; // flexi room
}
