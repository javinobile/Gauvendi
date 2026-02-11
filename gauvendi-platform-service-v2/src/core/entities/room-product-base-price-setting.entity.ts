import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';
import { RoomProductBasePriceSettingModeEnum } from '../enums/common';
import { NumericColumn } from '../decorators/numeric-column.decorator';

@Entity('room_product_base_price_setting')
@Index(['hotelId', 'roomProductId'], { unique: true })
@Index(['hotelId'])
@Index(['roomProductId'])
@Index(['hotelId', 'roomProductId', 'mode'])
@Index(['hotelId', 'mode'])
export class RoomProductBasePriceSetting extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({
    type: 'text',
    name: 'mode',
    nullable: false,
    default: RoomProductBasePriceSettingModeEnum.FEATURE_BASED
  })
  mode: RoomProductBasePriceSettingModeEnum;

  @NumericColumn({ name: 'fixed_price', precision: 26, scale: 4, nullable: true, default: 9999 })
  fixedPrice: number;

  // Relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductBasePriceSettings)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;
}
