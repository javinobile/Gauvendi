import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';

export enum RoomProductBasePriceSettingModeEnum {
  FEATURE_BASED = 'FEATURE_BASED',
  AVERAGE = 'AVERAGE',
  COMBINED = 'COMBINED',
}

@Entity('room_product_base_price_setting')
@Index(['hotelId', 'roomProductId'], { unique: true })
@Index(['hotelId'])
@Index(['roomProductId'])
@Index(['hotelId', 'roomProductId', 'mode'])
@Index(['hotelId', 'mode'])
export class RoomProductBasePriceSetting extends BaseEntity {
  @Column({ type: 'varchar', name: 'hotel_id', length: 36, nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({ type: 'text', name: 'mode', nullable: false, default: RoomProductBasePriceSettingModeEnum.FEATURE_BASED })
  mode: RoomProductBasePriceSettingModeEnum;

  // Relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductBasePriceSettings)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;
}
