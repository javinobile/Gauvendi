import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntityWithDeleted } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';
import { IntegerColumn } from '../decorators/integer-column.decorator';
@Entity('room_product_daily_availability')
@Index(['hotelId', 'roomProductId', 'date'], { unique: true })
@Index(['roomProductId'])
@Index(['hotelId', 'date'])
export class RoomProductDailyAvailability extends BaseEntityWithDeleted {
  @Column({type: 'uuid', nullable: false, name: 'room_product_id'})
  roomProductId: string;

  @Column({ nullable: true, name: 'hotel_id', type: 'varchar', length: 36 })
  hotelId: string;

  @Column({ nullable: true, name: 'date', type: 'text' })
  date: string;

  @IntegerColumn({ nullable: true, name: 'available', type: 'integer', })
  available: number;

  @IntegerColumn({ nullable: true, name: 'sold', type: 'integer' })
  sold: number;

  @IntegerColumn({ nullable: true, name: 'sell_limit', type: 'integer' })
  sellLimit: number;

  @IntegerColumn({ nullable: true, name: 'adjustment', type: 'integer' })
  adjustment: number;

  // relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductDailyAvailabilities)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;
}