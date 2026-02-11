import { Module } from '@nestjs/common';
import { RatePlanDailyAdjustmentRepositoryModule } from './rate-plan-adjustment-repository.module';
import { RatePlanDailyAdjustmentController } from '../controllers/rate-plan-daily-adjustment.controller';

@Module({
  imports: [RatePlanDailyAdjustmentRepositoryModule],
  controllers: [RatePlanDailyAdjustmentController],
  providers: [],
  exports: []
})
export class RatePlanDailyAdjustmentModule {}
