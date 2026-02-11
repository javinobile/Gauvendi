import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CalculateSellingPriceDto,
  GetRoomProductPricingModeDto,
  SellingPriceQuery
} from './room-product-selling-price.dto';
import { RoomProductSellingPriceService } from './room-product-selling-price.service';

@Controller('room-product-rate-plan')
export class RoomProductSellingPriceController {
  constructor(private readonly roomProductSellingPriceService: RoomProductSellingPriceService) {}

  @MessagePattern({ cmd: 'get_selling_price' })
  async getSellingPrice(@Payload() query: SellingPriceQuery) {
    return await this.roomProductSellingPriceService.getSellingPrice(query);
  }

  @MessagePattern({ cmd: 'get_pricing_mode' })
  async getPricingMode(@Payload() query: GetRoomProductPricingModeDto) {
    return this.roomProductSellingPriceService.getPricingMode(query);
  }

  @MessagePattern({ cmd: 'calculate_selling_price' })
  async calculateSellingPrice(@Payload() body: CalculateSellingPriceDto) {
    return await this.roomProductSellingPriceService.calculateSellingPrice(body);
  }

  @MessagePattern({ cmd: 'compute_selling_price' })
  async computeSellingPrice(@Payload() computeDto: CalculateSellingPriceDto) {
    return await this.roomProductSellingPriceService.computeSellingPrice(computeDto);
  }

}
