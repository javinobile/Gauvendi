import { Module } from '@nestjs/common';
import { RatePlanCancellationPolicyDailyRepositoryModule } from '../rate-plan-cancellation-policy-daily/rate-plan-cancellation-policy-daily-repository.module';
import { RatePlanDailyPaymentTermRepositoryModule } from '../rate-plan-daily-payment-term/rate-plan-daily-payment-term-repository.module';
import { RatePlanSharedModule } from './rate-plan-shared.module';
import { SellingRatePlanService } from './services/selling-rate-plan.service';

@Module({
  imports: [
    RatePlanSharedModule,
    RatePlanCancellationPolicyDailyRepositoryModule,
    RatePlanDailyPaymentTermRepositoryModule
  ],
  providers: [SellingRatePlanService],
  exports: [SellingRatePlanService]
})
export class SellingRatePlanModule {}
