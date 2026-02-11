import { Body, Controller, Post } from "@nestjs/common";
import { Public } from "@src/core/decorators/is-public.decorator";
import { BulkTriggerAllPricingDto, PmsEventPricingUpdateDto, UpdateRoomProductPricingMethodDetailDto } from "./room-product-pricing-method-detail.dto";
import { RoomProductPricingMethodDetailService } from "./room-product-pricing-method-detail.service";

@Controller("room-product-rate-plan")
export class RoomProductPricingMethodDetailController {
  constructor(private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService) {}

  @Post("feature-based-pricing")
  async featureBasedPricing(@Body() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.featureBasedPricing(body);
  }

  @Post("trigger-all-room-product-pricing-method-detail")
  async triggerAllRoomProductPricingMethodDetail(@Body() body: { hotelId: string; ratePlanIds: string[] }) {
    return this.roomProductPricingMethodDetailService.triggerAllRoomProductPricingMethodDetail(body);
  }

  @Post("feature-based-pms-pricing")
  async syncPmsRatePlanPricing(@Body() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.syncPmsRatePlanPricing(body);
  }

  @Post("mrfc-positioning")
  async mrfcPositioning(@Body() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.mrfcPositioning(body);
  }

  @Post("link-product")
  async linkProduct(@Body() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.linkProduct(body);
  }

  @Post("derived-product")
  async derivedProduct(@Body() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.derivedProduct(body);
  }

  @Post("pms-event-pricing-update")
  async pmsEventPricingUpdate(@Body() body: PmsEventPricingUpdateDto) {
    return this.roomProductPricingMethodDetailService.pmsEventPricingUpdate(body);
  }

  @Public()
  @Post("bulk-trigger-all-pricing")
  async bulkTriggerAllPricing(@Body() body: BulkTriggerAllPricingDto) {
    return this.roomProductPricingMethodDetailService.triggerAllPricing(body);
  }

  @Public()
  @Post("pull-all-pricing-from-pms")
  async pullAllPricingFromPms(@Body() body: BulkTriggerAllPricingDto) {
    return this.roomProductPricingMethodDetailService.pullAllPricingFromPms(body);
  }
}
