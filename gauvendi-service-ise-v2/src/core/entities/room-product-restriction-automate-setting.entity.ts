import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';

@Entity({ name: 'room_product_restriction_automate_setting' })
@Index(['roomProductId', 'hotelId'])
export class RoomProductRestrictionAutomateSetting extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'room_product_id', unique: true })
  roomProductId: string;

  @Column({ type: 'varchar', nullable: false, name: 'hotel_id', length: 36 })
  hotelId: string;

  @Column({ type: 'boolean', nullable: true, name: 'is_automated', default: false })
  isAutomated: boolean;

  @Column({ type: 'boolean', nullable: true, name: 'override_default', default: false })
  overrideDefault: boolean;

  @Column({ type: 'boolean', nullable: true, name: 'override_default_set_maximum', default: false })
  overrideDefaultSetMaximum: boolean;

  @OneToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductRestrictionAutomateSetting)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;
}
