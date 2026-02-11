
import { Module } from '@nestjs/common';
import { RatePlanV2RepositoryModule } from '@src/modules/rate-plan/modules/rate-plan-v2-repository.module';
import { RatePlanAdjustmentService } from './rate-plan-adjustment.service';

@Module({
  imports: [
    RatePlanV2RepositoryModule,

  ],
  providers: [
    RatePlanAdjustmentService
  ],
  exports: [
    RatePlanAdjustmentService
  ]
})
export class RatePlanAdjustmentModule {}
