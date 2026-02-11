import { Module } from '@nestjs/common';
import { RoomProductRatePlanService } from './room-product-rate-plan.service';
import { RoomProductRatePlanController } from './room-product-rate-plan.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';
import { RoomProductSellingPriceModule } from './room-product-selling-price/room-product-selling-price.module';
import { RoomProductPricingMethodDetailModule } from './room-product-pricing-method-detail/room-product-pricing-method-detail.module';

@Module({
  controllers: [RoomProductRatePlanController],
  providers: [RoomProductRatePlanService],
  imports: [PlatformClientModule, RoomProductSellingPriceModule, RoomProductPricingMethodDetailModule],
})
export class RoomProductRatePlanModule {}
