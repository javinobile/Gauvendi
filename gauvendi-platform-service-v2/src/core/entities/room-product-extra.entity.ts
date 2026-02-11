import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RoomProduct } from './room-product.entity';
import { BaseEntity } from '../database/entities/base.entity';
import { HotelAmenity } from './hotel-entities/hotel-amenity.entity';
import { RoomProductExtraType } from '../enums/common';

@Entity('room_product_extra')
@Index(['hotelId', 'roomProductId', 'type'])
@Index(['roomProductId'])
export class RoomProductExtra extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'room_product_id' })
  roomProductId: string;

  @Column({ nullable: true, name: 'extras_id', type: 'uuid' })
  extrasId: string;

  @Column({ nullable: true, name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @Column({ nullable: true, name: 'type', type: 'text' })
  type: RoomProductExtraType;

  // relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductExtras)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @ManyToOne(() => HotelAmenity, (extra) => extra.roomProductExtras)
  @JoinColumn({ name: 'extras_id' })
  extra: HotelAmenity;
}
