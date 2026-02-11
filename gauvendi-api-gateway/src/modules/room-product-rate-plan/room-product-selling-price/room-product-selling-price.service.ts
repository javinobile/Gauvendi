import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CalculateSellingPriceDto, GetRoomProductPricingModeDto, RoomProductPricingRequestDto, SellingPriceQuery } from "./room-product-selling-price.dto";

@Injectable()
export class RoomProductSellingPriceService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getSellingPrice(query: SellingPriceQuery) {
    return this.platformClient.send({ cmd: "get_selling_price" }, query);
  }

  getPricingMode(query: GetRoomProductPricingModeDto) {
    return this.platformClient.send({ cmd: "get_pricing_mode" }, query);
  }

  calculateSellingPrice(body: CalculateSellingPriceDto) {
    return this.platformClient.send({ cmd: "calculate_selling_price" }, body);
  }

  computeSellingPrice(body: CalculateSellingPriceDto) {
    return this.platformClient.send({ cmd: "compute_selling_price" }, body);
  }

  getLowestPriceCalendar(body: RoomProductPricingRequestDto) {
    return this.platformClient.send({ cmd: "get_lowest_price_calendar" }, body);
  }
}
