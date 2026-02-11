import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';

@Entity()
@Index(['hotelId', 'roomProductId'], { unique: true })
@Index(['roomProductId'])
export class RoomProductMappingPms extends BaseEntity {
  @Column({ type: 'uuid', name: 'room_product_id' })
  roomProductId: string;

  @Column({ type: 'varchar', name: 'hotel_id', length: 36 })
  hotelId: string;

  @Column({ type: 'varchar', name: 'room_product_mapping_pms_code', nullable: true })
  roomProductMappingPmsCode: string;

  // relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductMappingPms)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;
}
