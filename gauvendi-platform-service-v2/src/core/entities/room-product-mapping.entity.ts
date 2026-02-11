import { Column, Entity, ManyToOne, JoinColumn, OneToOne, Index } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';

@Entity('room_product_mapping')
@Index(['hotelId', 'roomProductId'])
@Index(['hotelId', 'relatedRoomProductId'])
@Index(['roomProductId'])
@Index(['relatedRoomProductId'])
export class RoomProductMapping extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string; // MRFC id

  @Column({ type: 'uuid', name: 'related_room_product_id', nullable: false })
  relatedRoomProductId: string; // RFC id

  // relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductMappings)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.relatedRoomProductMapping)
  @JoinColumn({ name: 'related_room_product_id' })
  relatedRoomProduct: RoomProduct;
}
