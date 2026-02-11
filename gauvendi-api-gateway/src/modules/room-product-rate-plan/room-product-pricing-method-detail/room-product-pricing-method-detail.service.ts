import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { PmsEventPricingUpdateDto, UpdateRoomProductPricingMethodDetailDto } from "./room-product-pricing-method-detail.dto";

@Injectable()
export class RoomProductPricingMethodDetailService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) { }

  featureBasedPricing(body: UpdateRoomProductPricingMethodDetailDto) {
    return this.platformClient.send({ cmd: "feature_based_pricing" }, body);
  }

  triggerAllRoomProductPricingMethodDetail(body: { hotelId: string, ratePlanIds: string[] }) {
    return this.platformClient.send({ cmd: "trigger_all_room_product_pricing_method_detail" }, body);
  }

  syncPmsRatePlanPricing(body: UpdateRoomProductPricingMethodDetailDto) {
    return this.platformClient.send({ cmd: "feature_based_pms_pricing" }, body);
  }

  triggerAllPricing(body: { hotelId: string }) {
    return this.platformClient.send({ cmd: "bulk_trigger_all_pricing" }, body);
  }

  pullAllPricingFromPms(body: { hotelId: string }) {
    return this.platformClient.send({ cmd: "pull_all_pricing_from_pms" }, body);
  }
  
  mrfcPositioning(body: UpdateRoomProductPricingMethodDetailDto) {
    return this.platformClient.send({ cmd: "mrfc_positioning" }, body);
  }

  linkProduct(body: UpdateRoomProductPricingMethodDetailDto) {
    return this.platformClient.send({ cmd: "link_product" }, body);
  }

  derivedProduct(body: UpdateRoomProductPricingMethodDetailDto) {
    return this.platformClient.send({ cmd: "derived_product" }, body);
  }

  pmsEventPricingUpdate(body: PmsEventPricingUpdateDto) {
    return this.platformClient.send({ cmd: "pms_event_pricing_update" }, body);
  }

}
