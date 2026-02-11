import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '../../../core/constants/db-name.constant';
import { RoomProductExtraOccupancyRate } from '../../../core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from '../../../core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductRatePlan } from '../../../core/entities/room-product-rate-plan.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentRepository } from '../repositories/room-product-rate-plan-extra-occupancy-rate-adjustment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        RoomProductRatePlanExtraOccupancyRateAdjustment,
        RoomProductRatePlan,
        RoomProductExtraOccupancyRate
      ],
      DbName.Postgres
    ),
    ConfigModule
  ],
  providers: [RoomProductRatePlanExtraOccupancyRateAdjustmentRepository],
  exports: [RoomProductRatePlanExtraOccupancyRateAdjustmentRepository]
})
export class RoomProductRatePlanExtraOccupancyRateAdjustmentRepositoryModule {}
