import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { NumericColumn } from '../../decorators/numeric-column.decorator';
import { HotelRetailFeature } from '../hotel-retail-feature.entity';

export enum FeatureDailyAdjustmentType {
  Fixed = 'Fixed',
  PricePercentage = 'PricePercentage',
  HotelOccupancyPercentage = 'HotelOccupancyPercentage',
  ProductOccupancyPercentage = 'ProductOccupancyPercentage'
}
@Entity({ name: 'feature_daily_adjustment' })
@Index(['date'])
@Index(['hotelId', 'date', 'featureId'], { unique: true })
@Index(['featureId'])
export class FeatureDailyAdjustment extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'uuid', name: 'feature_id', nullable: false })
  featureId: string;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  @ManyToOne(() => HotelRetailFeature, (feature) => feature.featureDailyAdjustments)
  @JoinColumn({ name: 'feature_id' })
  feature: HotelRetailFeature;

  @NumericColumn({ name: 'adjustment_value', precision: 26, scale: 4})
  adjustmentValue: string;

  @Column({
    type: 'text',
    name: 'adjustment_type',
    default: FeatureDailyAdjustmentType.Fixed
  })
  adjustmentType: FeatureDailyAdjustmentType;
}
