import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { OccupancySurchargeCalculateService } from '@src/core/modules/pricing-calculate/services/occupancy-surcharge​-calculate.service';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto } from '../room-product-rate-plan-extra-occupancy-rate-adjustment/dto';
import { RoomProductRatePlanAvailabilityAdjustmentInputDto } from './dtos/room-product-rate-plan-availability-adjustment-input.dto';
import { RoomProductRatePlanExtraOccupancyRateDailyFilter } from './dtos/room-product-rate-plan-extra-occupancy-rate-daily.dto';
import {
  GetListRoomProductRatePlanDto,
  GetPmsRatePlanDto,
  GetRoomProductRatePlanIntegrationSettingDto,
  SyncRatePlanPricingDto,
  UpdateRoomProductRatePlanConfigSettingDto,
  UpdateRoomProductRatePlanSellabilityDto
} from './room-product-rate-plan.dto';
import { RoomProductRatePlanService } from './room-product-rate-plan.service';

@Controller('room-product-rate-plan')
export class RoomProductRatePlanController {
  constructor(private readonly roomProductRatePlanService: RoomProductRatePlanService, private readonly occupancySurchargeCalculateService: OccupancySurchargeCalculateService) {}

  @MessagePattern({ cmd: 'get_list_room_product_rate_plan' })
  async getList(@Payload() query: GetListRoomProductRatePlanDto) {
    return this.roomProductRatePlanService.getList(query);
  }

  @MessagePattern({ cmd: 'update_room_product_rate_plan_config_setting' })
  async updateConfigSetting(@Payload() body: UpdateRoomProductRatePlanConfigSettingDto) {
    return this.roomProductRatePlanService.updateConfigSetting(body);
  }

  @MessagePattern({ cmd: 'update_room_product_rate_plan_sellability' })
  async updateSellability(@Payload() body: UpdateRoomProductRatePlanSellabilityDto[]) {
    return this.roomProductRatePlanService.updateSellability(body);
  }

  @MessagePattern({ cmd: 'delete_room_product_rate_plan_config_setting' })
  async deleteConfigSetting(@Payload() id: string) {
    return this.roomProductRatePlanService.deleteConfigSetting(id);
  }

  @MessagePattern({ cmd: 'get_pms_rate_plan' })
  async getPmsRatePlan(@Payload() query: GetPmsRatePlanDto) {
    return this.roomProductRatePlanService.getPmsRatePlan(query);
  }

  @MessagePattern({ cmd: 'sync_rate_plan_pricing' })
  async syncRatePlanPricing(@Payload() query: SyncRatePlanPricingDto) {
    return this.roomProductRatePlanService.syncRatePlanPricing(query);
  }

  @MessagePattern({
    cmd: CMD.ROOM_PRODUCT_RATE_PLAN.CREATE_OR_UPDATE_EXTRA_OCCUPANCY_RATE_ADJUSTMENT
  })
  async createOrUpdateExtraOccupancyRateAdjustment(
    @Payload() body: RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto
  ) {
    return this.roomProductRatePlanService.createOrUpdateExtraOccupancyRateAdjustment(body);
  }

  @MessagePattern({
    cmd: CMD.ROOM_PRODUCT_RATE_PLAN.CREATE_OR_UPDATE_AVAILABILITY_ADJUSTMENT
  })
  async createOrUpdateAvailabilityAdjustment(
    @Payload() body: RoomProductRatePlanAvailabilityAdjustmentInputDto
  ) {
    return this.roomProductRatePlanService.createOrUpdateAvailabilityAdjustment(body);
  }

  @MessagePattern({
    cmd: CMD.ROOM_PRODUCT_RATE_PLAN.GET_DAILY_OCCUPANCY_SURCHARGE_RATE
  })
  async getDailyOccupancySurchargeRate(
    @Payload() body: RoomProductRatePlanExtraOccupancyRateDailyFilter
  ) {
    return this.roomProductRatePlanService.getDailyOccupancySurchargeRate(body);
  }

  @MessagePattern({ cmd: 'get_room_product_rate_plan_integration_setting' })
  async getRoomProductRatePlanIntegrationSetting(@Payload() body: GetRoomProductRatePlanIntegrationSettingDto) {
    return this.roomProductRatePlanService.getRoomProductRatePlanIntegrationSetting(body);
  }
}
