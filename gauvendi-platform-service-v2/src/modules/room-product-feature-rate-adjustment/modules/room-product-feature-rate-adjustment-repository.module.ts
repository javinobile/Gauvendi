import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductFeatureRateAdjustment } from 'src/core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { RoomProductDailyBasePrice } from 'src/core/entities/room-product-daily-base-price.entity';
import { RoomProductFeatureRateAdjustmentRepository } from '../repositories/room-product-feature-rate-adjustment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [RoomProductFeatureRateAdjustment, RoomProductRatePlan, RoomProductDailyBasePrice],
      DbName.Postgres
    ),
    ConfigModule
  ],
  providers: [RoomProductFeatureRateAdjustmentRepository],
  exports: [RoomProductFeatureRateAdjustmentRepository]
})
export class RoomProductFeatureRateAdjustmentRepositoryModule {}
