import { Module } from '@nestjs/common';
import { RatePlanDailySellabilityController } from '../controllers/rate-plan-daily-sellability.controller';
import { RatePlanDailySellabilityService } from '../services/rate-plan-daily-sellability.service';
import { RatePlanDailySellabilityRepositoryModule } from './rate-plan-daily-sellability-repository.module';

@Module({
  imports: [RatePlanDailySellabilityRepositoryModule],
  controllers: [RatePlanDailySellabilityController],
  providers: [RatePlanDailySellabilityService],
  exports: [RatePlanDailySellabilityService]
})
export class RatePlanDailySellabilityModule {}
