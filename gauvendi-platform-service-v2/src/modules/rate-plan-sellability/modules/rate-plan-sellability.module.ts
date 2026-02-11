import { Module } from '@nestjs/common';
import { RatePlanRepositoryModule } from '@src/modules/rate-plan/modules/rate-plan-repository.module';
import { RatePlanSellabilityController } from '../controllers/rate-plan-sellability.controller';
import { RatePlanSellabilityService } from '../services/rate-plan-sellability.service';
import { RatePlanSellabilityRepositoryModule } from './rate-plan-sellability-repository.module';

@Module({
  imports: [RatePlanRepositoryModule, RatePlanSellabilityRepositoryModule],
  controllers: [RatePlanSellabilityController],
  providers: [RatePlanSellabilityService],
  exports: [RatePlanSellabilityService]
})
export class RatePlanSellabilityModule {}
