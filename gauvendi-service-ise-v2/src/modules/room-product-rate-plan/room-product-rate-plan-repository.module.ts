import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { RoomProductRatePlanRepository } from './room-product-rate-plan.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RoomProductRatePlan], DB_NAME.POSTGRES), ConfigModule],
  providers: [RoomProductRatePlanRepository],
  exports: [RoomProductRatePlanRepository]
})
export class RoomProductRatePlanRepositoryModule {}
