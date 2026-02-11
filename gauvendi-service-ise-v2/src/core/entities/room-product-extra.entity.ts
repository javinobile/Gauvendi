import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { HotelAmenity } from './hotel-entities/hotel-amenity.entity';
import { RoomProduct } from './room-product.entity';

export enum RoomProductExtraType {
  INCLUDED = 'INCLUDED',
  EXTRA = 'EXTRA',
  MANDATORY = 'MANDATORY',
}

@Entity('room_product_extra')
@Index(['hotelId', 'roomProductId', 'type'])
@Index(['roomProductId'])
export class RoomProductExtra extends BaseEntity {
  @Column({type: 'uuid', nullable: false, name: 'room_product_id'})
  roomProductId: string;

  @Column({ nullable: true, name: 'extras_id', type: 'varchar' })
  extrasId: string;

  @Column({ nullable: true, name: 'hotel_id', type: 'varchar' })
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