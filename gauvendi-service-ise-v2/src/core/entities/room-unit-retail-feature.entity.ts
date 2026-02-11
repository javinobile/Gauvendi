import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { HotelRetailFeature } from './hotel-retail-feature.entity';
import { RoomUnit } from './room-unit.entity';

@Entity({ name: 'room_unit_retail_feature' })
@Index(['hotelId'])
@Index(['hotelId', 'roomUnitId'])
@Index(['hotelId', 'retailFeatureId'])
@Index(['roomUnitId'])
@Index(['retailFeatureId'])
export class RoomUnitRetailFeature extends BaseEntity {
  @Column({ type: 'varchar', name: 'hotel_id', nullable: false, length: 36 })
  hotelId: string;

  @Column({ type: 'uuid', name: 'room_unit_id', nullable: false })
  roomUnitId: string;

  @Column({ type: 'uuid', name: 'retail_feature_id', nullable: false })
  retailFeatureId: string;

  @Column({ type: 'integer', name: 'quantity', nullable: true })
  quantity: number;

  // Relations
  @ManyToOne(() => RoomUnit, { lazy: true })
  @JoinColumn({ name: 'room_unit_id' })
  roomUnit: Promise<RoomUnit>;

  @ManyToOne(() => HotelRetailFeature, (feature) => feature.roomUnitRetailFeatures)
  @JoinColumn({ name: 'retail_feature_id' })
  retailFeature: HotelRetailFeature;
}