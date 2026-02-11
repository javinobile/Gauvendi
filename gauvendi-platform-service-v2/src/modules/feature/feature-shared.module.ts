import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from '@src/core/constants/db.const';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { FeatureDailyAdjustment } from '@src/core/entities/pricing-entities/feature-daily-adjustment.entity';
import { RatePlanFeatureDailyRate } from '@src/core/entities/pricing-entities/rate-plan-feature-daily-rate.entity';
import { RoomProductFeatureRateAdjustment } from '@src/core/entities/room-product-feature-rate-adjustment.entity';
import { FeatureRepository } from './feature.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [HotelRetailFeature, RatePlanFeatureDailyRate, RoomProductFeatureRateAdjustment, FeatureDailyAdjustment],
      DB_NAME.POSTGRES
    )
  ],
  providers: [FeatureRepository],
  exports: [FeatureRepository]
})
export class FeatureSharedModule {}
