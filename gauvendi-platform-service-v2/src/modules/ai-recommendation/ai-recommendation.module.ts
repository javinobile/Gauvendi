import { Module } from '@nestjs/common';
import { AiRecommendationController } from './ai-recommendation.controller';
import { RecommendationAlgorithmService } from './recommendation-algorithm.service';
import { RecommendationPipelineService } from './recommendation-pipeline.service';
import { OurTipService } from './our-tip.service';
import { DirectProductPipelineService } from './direct-product-pipeline.service';
import { DirectPipelineService } from './direct-pipeline.service';
import { CapacityScoreService } from './capacity-score.service';
import { MergedRequestsService } from './merged-requests.service';
import { PriceJumpService } from './price-jump.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [AiRecommendationController],
  providers: [
    RecommendationAlgorithmService,
    RecommendationPipelineService,
    OurTipService,
    DirectPipelineService,
    DirectProductPipelineService,
    CapacityScoreService,
    MergedRequestsService,
    PriceJumpService,
    
  ],
  exports: [
    RecommendationAlgorithmService,
    RecommendationPipelineService,
    OurTipService,
    DirectPipelineService,
    DirectProductPipelineService,
    CapacityScoreService,
    MergedRequestsService,
    PriceJumpService,
    CapacityScoreService,
  ],
  imports: [ConfigModule]
})
export class AiRecommendationModule {}
