import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { RoomProductRatePlanAvailabilityAdjustmentInputDto } from "./dtos/room-product-rate-plan-availability-adjustment-input.dto";
import { RoomProductRatePlanExtraOccupancyRateAdjustmentInput } from "./dtos/room-product-rate-plan-extra-occupancy-rate-adjustment-input.dto";
import { RoomProductRatePlanExtraOccupancyRateDailyFilter } from "./dtos/room-product-rate-plan-extra-occupancy-rate-daily.dto";
import {
  GetListRoomProductRatePlanDto,
  GetRoomProductRatePlanIntegrationSettingDto,
  SyncRatePlanPricingDto,
  UpdateRoomProductRatePlanConfigSettingDto,
  UpdateRoomProductRatePlanSellabilityDto
} from "./room-product-rate-plan.dto";

@Injectable()
export class RoomProductRatePlanService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getList(query: GetListRoomProductRatePlanDto) {
    return this.platformClient.send({ cmd: "get_list_room_product_rate_plan" }, query);
  }

  updateConfigSetting(body: UpdateRoomProductRatePlanConfigSettingDto) {
    return this.platformClient.send({ cmd: "update_room_product_rate_plan_config_setting" }, body);
  }

  updateSellability(body: UpdateRoomProductRatePlanSellabilityDto[]) {
    return this.platformClient.send({ cmd: "update_room_product_rate_plan_sellability" }, body);
  }

  deleteConfigSetting(id: string) {
    return this.platformClient.send({ cmd: "delete_room_product_rate_plan_config_setting" }, id);
  }



  syncRatePlanPricing(query: SyncRatePlanPricingDto) {
    return this.platformClient.send({ cmd: "sync_rate_plan_pricing" }, query);
  }

  createOrUpdateExtraOccupancyRateAdjustment(query: RoomProductRatePlanExtraOccupancyRateAdjustmentInput) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT_RATE_PLAN.CREATE_OR_UPDATE_EXTRA_OCCUPANCY_RATE_ADJUSTMENT }, query);
  }

  createOrUpdateAvailabilityAdjustment(query: RoomProductRatePlanAvailabilityAdjustmentInputDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT_RATE_PLAN.CREATE_OR_UPDATE_AVAILABILITY_ADJUSTMENT }, query);
  }

  getDailyOccupancySurchargeRate(query: RoomProductRatePlanExtraOccupancyRateDailyFilter) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT_RATE_PLAN.GET_DAILY_OCCUPANCY_SURCHARGE_RATE }, query);
  }

  getRoomProductRatePlanIntegrationSetting(query: GetRoomProductRatePlanIntegrationSettingDto) {
    return this.platformClient.send({ cmd: "get_room_product_rate_plan_integration_setting" }, query);
  }
}
