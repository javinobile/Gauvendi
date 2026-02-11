import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { HotelStandardFeature } from './hotel-standard-feature.entity';
import { RoomProduct } from './room-product.entity';

@Entity({ name: 'room_product_standard_feature' })
@Index(['hotelId'])
@Index(['hotelId', 'roomProductId'])
@Index(['hotelId', 'standardFeatureId'])
@Index(['roomProductId'])
@Index(['standardFeatureId'])
export class RoomProductStandardFeature extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({ type: 'uuid', name: 'standard_feature_id', nullable: false })
  standardFeatureId: string;

  // Relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductStandardFeatures)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @ManyToOne(
    () => HotelStandardFeature,
    (hotelStandardFeature) => hotelStandardFeature.roomProductStandardFeatures
  )
  @JoinColumn({ name: 'standard_feature_id' })
  standardFeature: HotelStandardFeature;
}
