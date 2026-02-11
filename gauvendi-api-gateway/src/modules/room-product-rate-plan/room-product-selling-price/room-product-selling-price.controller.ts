import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { RoomProductSellingPriceService } from "./room-product-selling-price.service";
import { SellingPriceQuery, GetRoomProductPricingModeDto, CalculateSellingPriceDto, RoomProductPricingRequestDto } from "./room-product-selling-price.dto";

@Controller("room-product-rate-plan")
export class RoomProductSellingPriceController {
  constructor(private readonly roomProductSellingPriceService: RoomProductSellingPriceService) {}

  @Get("selling-price")
  getSellingPrice(@Query() query: SellingPriceQuery) {
    return this.roomProductSellingPriceService.getSellingPrice(query);
  }

  @Post("lowest-price-calendar")
  async getLowestPriceCalendar(@Body() request: RoomProductPricingRequestDto) {
    return this.roomProductSellingPriceService.getLowestPriceCalendar(request);
  }

  @Get("pricing-mode")
  getPricingMode(@Query() query: GetRoomProductPricingModeDto) {
    return this.roomProductSellingPriceService.getPricingMode(query);
  }

  @Post("calculate-selling-price")
  calculateSellingPrice(@Body() body: CalculateSellingPriceDto) {
    return this.roomProductSellingPriceService.calculateSellingPrice(body);
  }

  @Post("compute-selling-price")
  computeSellingPrice(@Body() computeDto: CalculateSellingPriceDto) {
    return this.roomProductSellingPriceService.computeSellingPrice(computeDto);
  }
}
