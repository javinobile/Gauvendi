import { Module } from '@nestjs/common';
import { RoomProductPricingMethodDetailService } from './room-product-pricing-method-detail.service';
import { RoomProductPricingMethodDetailController } from './room-product-pricing-method-detail.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [RoomProductPricingMethodDetailController],
  providers: [RoomProductPricingMethodDetailService],
  imports: [PlatformClientModule],
})
export class RoomProductPricingMethodDetailModule {}
