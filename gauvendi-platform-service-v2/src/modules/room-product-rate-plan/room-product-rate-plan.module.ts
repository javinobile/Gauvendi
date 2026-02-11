import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { PricingCalculateModule } from '@src/core/modules/pricing-calculate/pricing-calculate.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { PmsModule } from '../pms/pms.module';
import { RatePlanRepositoryModule } from '../rate-plan/modules/rate-plan-repository.module';
import { RoomProductExtraOccupancyRateRepositoryModule } from '../room-product-extra-occupancy-rate/modules/room-product-extra-occupancy-rate-repository.module';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentRepositoryModule } from '../room-product-rate-plan-extra-occupancy-rate-adjustment/modules/room-product-rate-plan-extra-occupancy-rate-adjustment-repository.module';
import { RoomProductPricingMethodDetailModule } from './room-product-pricing-method-detail/room-product-pricing-method-detail.module';
import { RoomProductRatePlanController } from './room-product-rate-plan.controller';
import { RoomProductRatePlanService } from './room-product-rate-plan.service';
import { RoomProductSellingPriceModule } from './room-product-selling-price/room-product-selling-price.module';

@Module({
  controllers: [RoomProductRatePlanController],
  providers: [RoomProductRatePlanService],
  imports: [
    RatePlanRepositoryModule,
    TypeOrmModule.forFeature(
      [RoomProductRatePlan, RatePlan, RoomProductRatePlanAvailabilityAdjustment, RoomProduct],
      DbName.Postgres
    ),
    RoomProductSellingPriceModule,
    PmsModule,
    RoomProductPricingMethodDetailModule,
    RoomProductRatePlanExtraOccupancyRateAdjustmentRepositoryModule,
    RoomProductExtraOccupancyRateRepositoryModule,
    PricingCalculateModule
  ],
  exports: [RoomProductRatePlanService]
})
export class RoomProductRatePlanModule {}
