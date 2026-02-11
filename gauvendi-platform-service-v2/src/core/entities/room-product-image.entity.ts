import { Entity, Column, JoinColumn, ManyToOne, Index } from 'typeorm';
import { RoomProduct } from './room-product.entity';
import { BaseEntity } from '../database/entities/base.entity';

@Entity('room_product_image')
@Index(['roomProductId', 'imageUrl'])
export class RoomProductImage extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'room_product_id' })
  roomProductId: string;

  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ nullable: true, name: 'description', type: 'text' })
  description: string;

  @Column({ nullable: true, name: 'image_url', type: 'text' })
  imageUrl: string;

  @Column({ nullable: true, name: 'sequence', type: 'integer' })
  sequence: number;

  // relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductImages)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;
}
