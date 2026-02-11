import { Module } from '@nestjs/common';
import { RatePlanService } from './rate-plan.service';
import { RatePlanController } from './rate-plan.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [RatePlanController],
  providers: [RatePlanService],
  imports: [PlatformClientModule],
})
export class RatePlanModule {}
