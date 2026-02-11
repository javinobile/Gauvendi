import { Module } from '@nestjs/common';
import { HotelRepositoryModule } from '@src/modules/hotel/modules/hotel-repository.module';
import { RatePlanV2RepositoryModule } from '@src/modules/rate-plan/modules/rate-plan-v2-repository.module';
import { RoomProductRatePlanRepositoryModule } from '@src/modules/room-product-rate-plan/room-product-rate-plan-repository.module';
import { RoomProductSharedModule } from '@src/modules/room-product/room-product-shared.module';
import { RoomUnitRepositoryModule } from '@src/modules/room-unit/room-unit-repository.module';
import { RatePlanAdjustmentModule } from '../rate-plan-adjustment/rate-plan-adjustment.module';
import { CalculateAttributeBasedLogicService } from './calculate-attribute-based-logic.service';
import { CalculateAveragePricingService } from './calculate-average-pricing.service';
import { CalculateCombinedPricingService } from './calculate-combined-pricing.service';
import { CalculateFeatureBasePricingService } from './calculate-feature-base-pricing.service';
import { CalculateFixedPricingService } from './calculate-fixed-pricing.service';
import { CalculateReversedPricingService } from './calculate-reversed-pricing.service';
import { RoomProductPricingService } from './room-product-pricing.service';
import { CalculateLinkedPricingService } from './calculate-linked-pricing.service';
import { PricingCacheService } from '../../pricing-cache.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    RoomProductSharedModule,
    RoomUnitRepositoryModule,
    RatePlanAdjustmentModule,
    RoomProductRatePlanRepositoryModule,
    RatePlanV2RepositoryModule,
    HotelRepositoryModule,
    ConfigModule
  ],
  providers: [
    RoomProductPricingService,
    CalculateFeatureBasePricingService,
    CalculateCombinedPricingService,
    CalculateAveragePricingService,
    CalculateReversedPricingService,
    CalculateAttributeBasedLogicService,
    CalculateFixedPricingService,
    CalculateLinkedPricingService,
    PricingCacheService
  ],
  exports: [
    RoomProductPricingService,
    CalculateFeatureBasePricingService,
    CalculateCombinedPricingService,
    CalculateAveragePricingService,
    CalculateReversedPricingService,
    CalculateFixedPricingService,
    CalculateAttributeBasedLogicService,
    CalculateLinkedPricingService,
    PricingCacheService
  ]
})
export class RoomProductPricingModule {}
