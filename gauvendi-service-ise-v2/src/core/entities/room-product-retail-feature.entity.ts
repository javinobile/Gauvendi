import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { HotelRetailFeature } from './hotel-retail-feature.entity';
import { RoomProductFeatureRateAdjustment } from './room-product-feature-rate-adjustment.entity';
import { RoomProduct } from './room-product.entity';

@Entity({ name: 'room_product_retail_feature' })
@Index(['hotelId'])
@Index(['hotelId', 'roomProductId'])
@Index(['hotelId', 'retailFeatureId'])
@Index(['roomProductId'])
@Index(['retailFeatureId'])
export class RoomProductRetailFeature extends BaseEntity {
  @Column({ type: 'varchar', name: 'hotel_id', nullable: false, length: 36 })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: false })
  roomProductId: string;

  @Column({ type: 'integer', name: 'quantity', nullable: true })
  quantity: number;

  @Column({ type: 'uuid', name: 'retail_feature_id', nullable: false })
  retailFeatureId: string;

  // Relations
  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductRetailFeatures)
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;

  @ManyToOne(() => HotelRetailFeature, (feature) => feature.roomProductRetailFeatures)
  @JoinColumn({ name: 'retail_feature_id' })
  retailFeature: HotelRetailFeature;

  @OneToMany(
    () => RoomProductFeatureRateAdjustment,
    (roomProductFeatureRateAdjustment) => roomProductFeatureRateAdjustment.roomProductRetailFeature,
    { onDelete: 'CASCADE' },
  )
  roomProductFeatureRateAdjustments: RoomProductFeatureRateAdjustment[];
}
