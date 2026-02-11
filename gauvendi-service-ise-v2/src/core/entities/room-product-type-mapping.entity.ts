import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';

export enum RoomProductTypeMappingChannel {
  PMS = 'PMS',
  CM = 'CM',
  GAUVENDI = 'GAUVENDI',
}

@Entity('room_product_type_mapping')
@Index(['hotelId'])
@Index(['hotelId', 'roomProductId'])
@Index(['roomProductId'])
export class RoomProductTypeMapping extends BaseEntity {
  @Column({ type: 'varchar', length: 36, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id' })
  roomProductId: string;

  @Column({ type: 'text', name: 'related_code' })
  relatedCode: string;

  @Column({ type: 'text', name: 'channel' })
  channel: string;

  // Relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductTypeMapping)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;
}
