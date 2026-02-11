import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { NumericColumn } from '../../decorators/numeric-column.decorator';
import { RatePlan } from './rate-plan.entity';
import { HotelRetailFeature } from '../hotel-retail-feature.entity';

@Entity({ name: 'rate_plan_feature_daily_rate' })
@Index(['ratePlanId', 'date'])
@Index(['date'])
@Index(['ratePlanId', 'date', 'featureId'], { unique: true })
@Index(['ratePlanId'])
@Index(['featureId'])
@Index(['ratePlanId', 'featureId'])
export class RatePlanFeatureDailyRate extends BaseEntity {
  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'uuid', name: 'feature_id', nullable: false })
  featureId: string;

  @NumericColumn({ name: 'rate', precision: 26, scale: 4, nullable: false })
  rate: string;

  @Column({ type: 'text', name: 'date', nullable: false })
  date: string;

  // relation
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanFeatureDailyRates)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;

  // relation to feature
  @ManyToOne(() => HotelRetailFeature, (feature) => feature.ratePlanFeatureDailyRates)
  @JoinColumn({ name: 'feature_id' })
  feature: HotelRetailFeature;
}
