import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanDailyAdjustment } from 'src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanDailyAdjustmentRepository } from './rate-plan-daily-adjustment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlanDailyAdjustment], DB_NAME.POSTGRES), ConfigModule],
  providers: [RatePlanDailyAdjustmentRepository],
  exports: [RatePlanDailyAdjustmentRepository]
})
export class RatePlanDailyAdjustmentRepositoryModule {}
