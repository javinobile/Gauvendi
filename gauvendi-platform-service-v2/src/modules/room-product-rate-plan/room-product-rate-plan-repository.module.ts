import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from '@src/core/constants/db.const';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from '@src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProductRatePlanRepository } from './room-product-rate-plan.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        RoomProductRatePlan,
        RoomProductRatePlanAvailabilityAdjustment,
        RoomProductDailySellingPrice,
        RoomProductRatePlanExtraOccupancyRateAdjustment,
        RoomProductPricingMethodDetail
      ],
      DB_NAME.POSTGRES
    ),
    ConfigModule
  ],
  providers: [RoomProductRatePlanRepository],
  exports: [RoomProductRatePlanRepository]
})
export class RoomProductRatePlanRepositoryModule {}
