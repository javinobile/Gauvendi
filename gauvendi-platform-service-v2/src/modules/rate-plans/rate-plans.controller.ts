import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import {
  ApaleoRatePlanPmsMappingBulkInput,
  ApaleoRatePlanPmsMappingListFilter,
  ApaleoRoomProductRatePlanPmsMappingBulkInput,
  DailyRatePlanAdjustmentListFilter,
  DailySalesPlanPricingBreakdownFilter,
  DailyTrendDto,
  ExtranetRatePlanFilter,
  RatePlanProductsToSellDailyFilterDto,
  RoomProductDailyRateDetailsFilter,
  RoomProductDailyRateListFilter,
  SetLowestSellingPriceDto
} from './rate-plans.dto';
import { RatePlansService } from './rate-plans.service';

@Controller()
export class RatePlansController {
  constructor(private readonly ratePlansService: RatePlansService) {}

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_DAILY_PROPERTY_ADR_LIST })
  async getDailyPropertyAdrList(@Payload() payload: DailyTrendDto) {
    return await this.ratePlansService.getDailyPropertyAdrList(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_DAILY_PROPERTY_PICKUP_ADR_LIST })
  async getDailyPropertyPickupAdrList(@Payload() payload: DailyTrendDto) {
    return await this.ratePlansService.getDailyPropertyPickupAdrList(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_DAILY_PROPERTY_PACE_TRENDS })
  async getDailyPropertyPaceTrends(@Payload() payload: DailyTrendDto) {
    return await this.ratePlansService.getDailyPropertyPaceTrends(payload);
  }

  @MessagePattern({ cmd: 'migrate_rate_plan_translation' })
  async migrateRatePlanTranslation() {
    return await this.ratePlansService.migrateRatePlanTranslation();
  }

  @MessagePattern({ cmd: 'get_rate_plans' })
  async findAll(@Payload() filterDto: ExtranetRatePlanFilter) {
    return await this.ratePlansService.getListWithExpand(filterDto);
  }

  @MessagePattern({ cmd: 'daily_sales_plan_pricing_breakdown' })
  async dailySalesPlanPricingBreakdown(@Payload() filterDto: DailySalesPlanPricingBreakdownFilter) {
    return await this.ratePlansService.dailySalesPlanPricingBreakdown(filterDto);
  }

  @MessagePattern({ cmd: 'daily_rate_plan_adjustment_list' })
  async dailyRatePlanAdjustmentList(@Payload() filterDto: DailyRatePlanAdjustmentListFilter) {
    return await this.ratePlansService.dailyRatePlanAdjustmentList(filterDto);
  }

  @MessagePattern({ cmd: 'room_product_daily_rate_list' })
  async roomProductDailyRateList(@Payload() filterDto: RoomProductDailyRateListFilter) {
    return await this.ratePlansService.roomProductDailyRateList(filterDto);
  }

  @MessagePattern({ cmd: 'set_lowest_selling_price' })
  async setLowestSellingPrice(@Payload() body: SetLowestSellingPriceDto) {
    return await this.ratePlansService.setLowestSellingPrice(body);
  }

  @MessagePattern({ cmd: 'get_room_product_daily_rate_details' })
  async roomProductDailyRateDetails(@Payload() body: RoomProductDailyRateDetailsFilter) {
    return await this.ratePlansService.roomProductDailyRateDetails(body);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.PRODUCTS_TO_SELL_DAILY_LIST })
  async getProductsToSell(@Payload() filterDto: RatePlanProductsToSellDailyFilterDto) {
    return await this.ratePlansService.dailyProductsToSellList(filterDto);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_APALEO_RATE_PLAN_PMS_MAPPING_LIST })
  async getApaleoRatePlanPmsMappingList(@Payload() filterDto: ApaleoRatePlanPmsMappingListFilter) {
    return await this.ratePlansService.getApaleoRatePlanPmsMappingList(filterDto);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_APALEO_ROOM_PRODUCT_RATE_PLAN_PMS_MAPPING })
  async createOrUpdateApaleoRoomProductRatePlanPmsMapping(
    @Payload() body: ApaleoRoomProductRatePlanPmsMappingBulkInput
  ) {
    return await this.ratePlansService.createOrUpdateApaleoRoomProductRatePlanPmsMapping(body);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_APALEO_RATE_PLAN_PMS_MAPPING })
  async createOrUpdateApaleoRatePlanPmsMapping(@Payload() body: ApaleoRatePlanPmsMappingBulkInput) {
    return await this.ratePlansService.createOrUpdateApaleoRatePlanPmsMapping(body);
  }
}
