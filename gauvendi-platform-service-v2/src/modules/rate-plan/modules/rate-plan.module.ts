import { Module } from '@nestjs/common';
import { RatePlanController } from '../controllers/rate-plan.controller';
import { RatePlanRepositoryModule } from './rate-plan-repository.module';

@Module({
  imports: [RatePlanRepositoryModule],
  controllers: [RatePlanController],
  providers: [],
  exports: []
})
export class RatePlanModule {}
