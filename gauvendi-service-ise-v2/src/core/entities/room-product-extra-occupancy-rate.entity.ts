import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { NumericColumn } from '../decorators/numeric-column.decorator';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';

@Entity({ name: 'room_product_extra_occupancy_rate' })
@Index(['hotelId', 'roomProductId', 'extraPeople'] , { unique: true })
@Index(['hotelId', 'roomProductId'])
@Index(['hotelId', 'extraPeople'])
@Index(['hotelId', 'roomProductId', 'extraPeople', 'extraRate'])
@Index(['hotelId'])
@Index(['roomProductId'])
export class RoomProductExtraOccupancyRate extends BaseEntity {
  @Column({ name: 'room_product_id', type: 'uuid', nullable: false })
  roomProductId: string;

  @Column({ name: 'hotel_id', type: 'varchar', length: 36, nullable: false })
  hotelId: string;

  @Column({ name: 'extra_people', type: 'integer', nullable: true })
  extraPeople?: number;

  @NumericColumn({ name: 'extra_rate', type: 'decimal', precision: 26, scale: 4, nullable: true })
  extraRate?: string;

  // relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductExtraOccupancyRates)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;
}
