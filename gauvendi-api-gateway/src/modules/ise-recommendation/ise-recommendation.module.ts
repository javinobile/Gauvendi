import { Module } from '@nestjs/common';
import { IseRecommendationService } from './ise-recommendation.service';
import { IseRecommendationController } from './ise-recommendation.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [IseRecommendationController],
  providers: [IseRecommendationService],
  imports: [PlatformClientModule],
})
export class IseRecommendationModule {}
