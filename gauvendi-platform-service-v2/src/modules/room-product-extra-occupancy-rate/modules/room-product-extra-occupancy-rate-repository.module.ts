import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanSellability } from 'src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RoomProductExtraOccupancyRateRepository } from '../repositories/room-product-extra-occupancy-rate.repository';
import { RoomProductExtraOccupancyRate } from 'src/core/entities/room-product-extra-occupancy-rate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomProductExtraOccupancyRate], DbName.Postgres),
    ConfigModule
  ],
  providers: [RoomProductExtraOccupancyRateRepository],
  exports: [RoomProductExtraOccupancyRateRepository]
})
export class RoomProductExtraOccupancyRateRepositoryModule {}
