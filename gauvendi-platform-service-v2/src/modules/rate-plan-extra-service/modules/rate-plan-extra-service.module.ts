import { Module } from '@nestjs/common';
import { RatePlanExtraServiceController } from '../controllers/rate-plan-extra-service.controller';
import { RatePlanExtraServiceService } from '../services/rate-plan-extra-service.service';
import { RatePlanExtraServiceRepositoryModule } from './rate-plan-extra-service-repository.module';

@Module({
  imports: [RatePlanExtraServiceRepositoryModule],
  controllers: [RatePlanExtraServiceController],
  providers: [RatePlanExtraServiceService],
  exports: [RatePlanExtraServiceService]
})
export class RatePlanExtraServiceModule {}
