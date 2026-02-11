import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
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
import { RoomProductRatePlanService } from "./room-product-rate-plan.service";

@Controller("room-product-rate-plan")
export class RoomProductRatePlanController {
  constructor(private readonly roomProductRatePlanService: RoomProductRatePlanService) {}

  @Get("list")
  async getList(@Query() query: GetListRoomProductRatePlanDto) {
    return this.roomProductRatePlanService.getList(query);
  }

  @Post("config-setting")
  async updateConfigSetting(@Body() body: UpdateRoomProductRatePlanConfigSettingDto) {
    return this.roomProductRatePlanService.updateConfigSetting(body);
  }

  @Post("update-sellability")
  async updateSellability(@Body() body: UpdateRoomProductRatePlanSellabilityDto[]) {
    return this.roomProductRatePlanService.updateSellability(body);
  }

  @Delete("config-setting/:id")
  async deleteConfigSetting(@Param("id") id: string) {
    return this.roomProductRatePlanService.deleteConfigSetting(id);
  }


  @Post("pms-pricing")
  async syncRatePlanPricing(@Body() query: SyncRatePlanPricingDto) {
    return this.roomProductRatePlanService.syncRatePlanPricing(query);
  }

  @Post("extra-occupancy-rate-adjustment")
  async createOrUpdateExtraOccupancyRateAdjustment(@Body() query: RoomProductRatePlanExtraOccupancyRateAdjustmentInput) {
    return this.roomProductRatePlanService.createOrUpdateExtraOccupancyRateAdjustment(query);
  }

  @Post("availability-adjustment")
  async createOrUpdateAvailabilityAdjustment(@Body() query: RoomProductRatePlanAvailabilityAdjustmentInputDto) {
    return this.roomProductRatePlanService.createOrUpdateAvailabilityAdjustment(query);
  }

  @Get("daily-occupancy-surcharge-rate")
  async getDailyOccupancySurchargeRate(@Query() query: RoomProductRatePlanExtraOccupancyRateDailyFilter) {
    return this.roomProductRatePlanService.getDailyOccupancySurchargeRate(query);
  }

  @Get("integration-setting")
  async getRoomProductRatePlanIntegrationSetting(@Query() query: GetRoomProductRatePlanIntegrationSettingDto) {
    return this.roomProductRatePlanService.getRoomProductRatePlanIntegrationSetting(query);
  }
}
