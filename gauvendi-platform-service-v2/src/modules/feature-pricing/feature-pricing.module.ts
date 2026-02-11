
import { forwardRef, Module } from '@nestjs/common';
import { RoomProductSharedModule } from '@src/modules/room-product/room-product-shared.module';
import { FeatureSharedModule } from '../feature/feature-shared.module';
import { RoomProductPricingMethodDetailModule } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.module';
import { RoomProductRatePlanRepositoryModule } from '../room-product-rate-plan/room-product-rate-plan-repository.module';
import { FeaturePricingController } from './feature-pricing.controller';
import { FeaturePricingService } from './feature-pricing.service';

@Module({
  imports: [
    RoomProductSharedModule,
    RoomProductRatePlanRepositoryModule,
    forwardRef(() => RoomProductPricingMethodDetailModule),
    FeatureSharedModule
  ],
  controllers: [
    FeaturePricingController
  ],
  providers: [
    FeaturePricingService
  ],
  exports: [
    FeaturePricingService
  ]
})
export class FeaturePricingModule {}
