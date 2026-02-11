import { Module } from '@nestjs/common';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentController } from '../controllers/room-product-rate-plan-extra-occupancy-rate-adjustment.controller';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentRepositoryModule } from './room-product-rate-plan-extra-occupancy-rate-adjustment-repository.module';

@Module({
  imports: [RoomProductRatePlanExtraOccupancyRateAdjustmentRepositoryModule],
  controllers: [RoomProductRatePlanExtraOccupancyRateAdjustmentController]
})
export class RoomProductRatePlanExtraOccupancyRateAdjustmentModule {}
