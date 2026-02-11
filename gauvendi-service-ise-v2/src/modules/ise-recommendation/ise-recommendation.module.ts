import { Module } from '@nestjs/common';
import { PlatformClientModule } from 'src/core/clients/platform-client.module';
import { IseRecommendationController } from './ise-recommendation.controller';
import { IseRecommendationService } from './ise-recommendation.service';
import { RedisModule } from 'src/core/modules/redis/redis.module';

@Module({
  controllers: [IseRecommendationController],
  providers: [IseRecommendationService],
  imports: [PlatformClientModule, RedisModule],
})
export class IseRecommendationModule {}
