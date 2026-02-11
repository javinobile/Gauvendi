import { Module } from '@nestjs/common';
import { RoomProductSellingPriceService } from './room-product-selling-price.service';
import { RoomProductSellingPriceController } from './room-product-selling-price.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [RoomProductSellingPriceController],
  providers: [RoomProductSellingPriceService],
  imports: [PlatformClientModule],
})
export class RoomProductSellingPriceModule {}
