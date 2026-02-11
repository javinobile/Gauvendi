import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { ApaleoRatePlanPmsMappingBulkInput, ApaleoRatePlanPmsMappingListFilter, ApaleoRoomProductRatePlanPmsMappingBulkInput } from "./dtos/apoleo-rate-plan-pms-mapping.dto";
import { CppRatePlanFilterDto } from "./dtos/cpp-rate-plan.dto";
import { GetPmsRatePlanDto } from "./dtos/get-pms-rate-plan.dto";
import { RatePlanProductsToSellDailyFilterDto } from "./dtos/rate-plan-products-to-sell-daily";
import { RoomProductAssignToRatePlanFilterDto } from "./dtos/room-product-assign-to-rate-plan.filter";
import {
  DailyRatePlanAdjustmentListFilter,
  DailySalesPlanPricingBreakdownFilterDto,
  DailyTrendDto,
  DeleteAdjustmentDto,
  DeleteRatePlanDto,
  ExtranetRatePlanFilter,
  MonthlyRatePlanOverviewFilterDto,
  RatePlanDailyHotelOccupancyRateFilterDto,
  RatePlanDto,
  RatePlanFilterDto,
  RoomProductDailyRateDetailsFilter,
  RoomProductDailyRateListFilter,
  SetLowestSellingPriceDto,
  UpsertAdjustmentDto,
  UpsertSalePlanSellAbilityDto,
} from "./rate-plan.dto";
import { RatePlanService } from "./rate-plan.service";
import { CacheTTL } from "@nestjs/cache-manager";
import { Public } from "@src/core/decorators/is-public.decorator";

@Controller("rate-plans")
export class RatePlanController {
  constructor(private readonly ratePlanService: RatePlanService) {}

  @Get("")
  async getListWithExpand(@Query() query: ExtranetRatePlanFilter) {
    return this.ratePlanService.getListWithExpand(query);
  }

  @Get("migrate-translation")
  @Public()
  async migrateTranslation() {
    return this.ratePlanService.migrateTranslation();
  }

  @Get("daily-property-adr-list")
  async getDailyPropertyADRList(@Query() query: DailyTrendDto) {
    return this.ratePlanService.getDailyPropertyADRList(query);
  }

  @Get("daily-property-pace-trends")
  async getDailyPropertyPaceTrends(@Query() query: DailyTrendDto) {
    return this.ratePlanService.getDailyPropertyPaceTrends(query);
  }

  @Get("daily-property-pickup-adr-list")
  async getDailyPropertyPickupAdrList(@Query() query: DailyTrendDto) {
    return this.ratePlanService.getDailyPropertyPickupAdrList(query);
  }

  @Get("list")
  async getList(@Query() query: RatePlanFilterDto) {
    return this.ratePlanService.getList(query);
  }

  @CacheTTL(10 * 1000) // 10 seconds
  @Get("daily-hotel-occupancy-rate-list")
  async getDailyHotelOccupancyRateList(@Query() query: RatePlanDailyHotelOccupancyRateFilterDto) {
    return this.ratePlanService.getDailyHotelOccupancyRateList(query);
  }

  @CacheTTL(10 * 1000) // 10 seconds
  @Get("daily-sales-plan-pricing-breakdown")
  async getDailySalesPlanPricingBreakdown(@Query() query: DailySalesPlanPricingBreakdownFilterDto) {
    return await this.ratePlanService.getDailySalesPlanPricingBreakdown(query);
  }

  @CacheTTL(10 * 1000) // 10 seconds
  @Get("room-product-daily-rate-details")
  async getRoomProductDailyRateDetails(@Query() query: RoomProductDailyRateDetailsFilter) {
    return this.ratePlanService.getRoomProductDailyRateDetails(query);
  }

  @CacheTTL(10 * 1000) // 10 seconds
  @Get("room-product-daily-rate-list")
  async getRoomProductDailyRateList(@Query() query: RoomProductDailyRateListFilter) {
    return this.ratePlanService.getRoomProductDailyRateList(query);
  }

  @Get("daily-rate-plan-adjustment-list")
  async getRatePlanSellabilityList(@Query() query: DailyRatePlanAdjustmentListFilter) {
    return this.ratePlanService.getRatePlanSellabilityList(query);
  }

  @Get("room-product-assign-to-rate-plan")
  async getRoomProductAssignToRatePlan(@Query() query: RoomProductAssignToRatePlanFilterDto) {
    return this.ratePlanService.getRoomProductAssignToRatePlan(query);
  }

  // POST method
  @Post("")
  async createRatePlan(@Body() body: RatePlanDto) {
    return this.ratePlanService.createRatePlan(body);
  }

  // PUT method
  @Put(":id/upsert-adjustment")
  async upsertAdjustment(@Param("id") id: string, @Body() body: UpsertAdjustmentDto) {
    return this.ratePlanService.upsertAdjustment(id, body);
  }

  @Put(":salePlanId/sell-ability")
  async upsertSalePlanSellAbility(@Param("salePlanId") salePlanId: string, @Body() body: UpsertSalePlanSellAbilityDto) {
    return this.ratePlanService.upsertSalePlanSellAbility(salePlanId, body);
  }

  // PATCH method
  @Patch("set-lowest-selling-price")
  async setLowestSellingPrice(@Body() body: SetLowestSellingPriceDto) {
    return this.ratePlanService.setLowestSellingPrice(body);
  }

  @Patch(":id")
  async updateRatePlan(@Param("id") id: string, @Body() body: RatePlanDto) {
    return this.ratePlanService.updateRatePlan(id, body);
  }

  // DELETE method
  @Delete(":id/adjustment")
  async deleteAdjustment(@Param("id") id: string, @Body() body: DeleteAdjustmentDto) {
    return this.ratePlanService.deleteAdjustment(id, body);
  }

  @Delete(":id")
  async deleteRatePlan(@Param("id") id: string, @Query() query: DeleteRatePlanDto) {
    return this.ratePlanService.deleteRatePlan(id, query);
  }

  @Get("monthly-overview")
  async getMonthlyRatePlanOverview(@Query() query: MonthlyRatePlanOverviewFilterDto) {
    return this.ratePlanService.getMonthlyRatePlanOverview(query);
  }

  @Get("products-to-sell-daily-list")
  async getRatePlanProductsToSellDailyList(@Query() query: RatePlanProductsToSellDailyFilterDto) {
    return this.ratePlanService.getRatePlanProductsToSellDailyList(query);
  }

  @Get("pms")
  async getPmsRatePlan(@Query() query: GetPmsRatePlanDto) {
    return this.ratePlanService.getPmsRatePlan(query);
  }

  @Get("apaleo-room-product-rate-plan-pms-mapping")
  async getApaleoRatePlanPmsMappingList(@Query() query: ApaleoRatePlanPmsMappingListFilter) {
    return this.ratePlanService.getApaleoRatePlanPmsMappingList(query);
  }

  @Post("apaleo-room-product-rate-plan-pms-mapping")
  async upsertApaleoRoomProductRatePlanPmsMapping(@Body() body: ApaleoRoomProductRatePlanPmsMappingBulkInput) {
    return this.ratePlanService.upsertApaleoRoomProductRatePlanPmsMapping(body);
  }

  @Post("apaleo-rate-plan-pms-mapping")
  async upsertApaleoRatePlanPmsMapping(@Body() body: ApaleoRatePlanPmsMappingBulkInput) {
    return this.ratePlanService.upsertApaleoRatePlanPmsMapping(body);
  }

  @Post("cpp-rate-plan-list")
  async getCppRatePlanList(@Body() body: CppRatePlanFilterDto) {
    return this.ratePlanService.getCppRatePlanList(body);
  }

  @Post("onboard-whip-rate-plan")
  async onboardRatePlan(@Body() body: { hotelId: string }) {
    return this.ratePlanService.onboardRatePlan(body);
  }
}
