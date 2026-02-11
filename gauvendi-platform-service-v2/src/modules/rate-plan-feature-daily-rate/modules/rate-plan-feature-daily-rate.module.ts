import { Module } from '@nestjs/common';
import { RatePlanFeatureDailyRateController } from '../controllers/rate-plan-feature-daily-rate.controller';
import { RatePlanFeatureDailyRateRepositoryModule } from './rate-plan-feature-daily-rate-repository.module';

@Module({
  imports: [RatePlanFeatureDailyRateRepositoryModule],
  controllers: [RatePlanFeatureDailyRateController],
  providers: [],
  exports: []
})
export class RatePlanFeatureDailyRateModule {}
