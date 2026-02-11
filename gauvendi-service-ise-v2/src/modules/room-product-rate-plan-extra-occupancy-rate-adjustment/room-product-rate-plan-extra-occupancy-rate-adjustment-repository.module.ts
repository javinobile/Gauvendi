import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductExtraOccupancyRate } from 'src/core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from 'src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductExtraOccupancyRateRepository } from './room-product-extra-occupancy-rate.repository';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentRepository } from './room-product-rate-plan-extra-occupancy-rate-adjustment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [RoomProductRatePlanExtraOccupancyRateAdjustment, RoomProductExtraOccupancyRate],
      DB_NAME.POSTGRES
    ),
    ConfigModule
  ],
  providers: [
    RoomProductExtraOccupancyRateRepository,
    RoomProductRatePlanExtraOccupancyRateAdjustmentRepository
  ],
  exports: [
    RoomProductExtraOccupancyRateRepository,
    RoomProductRatePlanExtraOccupancyRateAdjustmentRepository
  ]
})
export class RoomProductRatePlanExtraOccupancyRateAdjustmentRepositoryModule {}
