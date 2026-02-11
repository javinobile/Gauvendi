import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { DailyRatePlanSellabilityFilterDto } from "./dtos/daily-rate-plan-sellability.dto";
import { DeleteRatePlanDailySellabilityInputDto } from "./dtos/delete-rate-plan-daily-sellability-input.dto";
import { AvailableSalesPlanToDeriveListDto, MappingHotelListDto, MarketSegmentListDto, SalesPlanSellabilityListDto } from "./dtos/mapping-hotel-list.dto";
import {
  CreateOrUpdateRatePlanCancellationPolicyDailyInputDto,
  DeleteRatePlanCancellationPolicyDailyInputDto,
  RatePlanCancellationPolicyDailyFilterDto,
} from "./dtos/rate-plan-cancellation-policy-daily.dto";
import { RatePlanDailySellabilityInputDto } from "./dtos/rate-plan-daily-sellability-input.dto";
import { CreateOrUpdateRatePlanExtrasDailyInputDto, DeleteRatePlanExtrasDailyInputDto, RatePlanHotelExtrasDailyFilterDto } from "./dtos/rate-plan-hotel-extras-daily.dto";
import { CreateOrUpdateRatePlanPaymentTermDailyInputDto, DeleteRatePlanPaymentTermDailyInputDto, RatePlanPaymentTermDailyFilterDto } from "./dtos/rate-plan-payment-term-daily.dto";
import { SettingsRatePlanService } from "./settings-rate-plan.service";

@Controller("settings-rate-plan")
export class SettingsRatePlanController {
  constructor(private readonly settingsRatePlanService: SettingsRatePlanService) {}

  @Get("mapping-hotel-list")
  async getMappingHotelList(@Query() query: MappingHotelListDto) {
    return this.settingsRatePlanService.getMappingHotelList(query);
  }

  @Get("market-segment-list")
  async getMarketSegmentList(@Query() query: MarketSegmentListDto) {
    return this.settingsRatePlanService.getMarketSegmentList(query);
  }

  @Get("sales-plan-sellability-list")
  async getSalesPlanSellabilityList(@Query() query: SalesPlanSellabilityListDto) {
    return this.settingsRatePlanService.getSalesPlanSellabilityList(query);
  }

  @Get("rate-plan-daily-sellability-list")
  async getSalesPlanDailySellabilityList(@Query() query: DailyRatePlanSellabilityFilterDto) {
    return this.settingsRatePlanService.getSalesPlanDailySellabilityList(query);
  }

  @Get("available-sales-plan-to-derive-list")
  async getAvailableSalesPlanToDeriveList(@Query() query: AvailableSalesPlanToDeriveListDto) {
    return this.settingsRatePlanService.getAvailableSalesPlanToDeriveList(query);
  }

  @Get("rate-plan-cancellation-policy-daily-list")
  async getRatePlanCxlPolicyDailyList(@Query() query: RatePlanCancellationPolicyDailyFilterDto) {
    return this.settingsRatePlanService.getRatePlanCxlPolicyDailyList(query);
  }

  @Get("rate-plan-payment-term-daily-list")
  async getRatePlanPaymentTermDailyList(@Query() query: RatePlanPaymentTermDailyFilterDto) {
    return this.settingsRatePlanService.getRatePlanPaymentTermDailyList(query);
  }

  @Get("rate-plan-hotel-extras-daily-list")
  async getRatePlanHotelExtrasDailyList(@Query() query: RatePlanHotelExtrasDailyFilterDto) {
    return this.settingsRatePlanService.getRatePlanHotelExtrasDailyList(query);
  }

  @Post("create-or-update-sales-plan-daily-sellability")
  async createOrUpdateSalesPlanDailySellability(@Body() input: RatePlanDailySellabilityInputDto) {
    return this.settingsRatePlanService.createOrUpdateSalesPlanDailySellability(input);
  }

  @Post("delete-rate-plan-daily-sellability")
  async deleteRatePlanDailySellability(@Body() input: DeleteRatePlanDailySellabilityInputDto) {
    return this.settingsRatePlanService.deleteRatePlanDailySellability(input);
  }

  @Post("delete-rate-plan-payment-term-daily")
  async deleteRatePlanPaymentTermDaily(@Body() input: DeleteRatePlanPaymentTermDailyInputDto) {
    return this.settingsRatePlanService.deleteRatePlanPaymentTermDaily(input);
  }

  @Post("delete-rate-plan-cancellation-policy-daily")
  async deleteRatePlanCxlPolicyDaily(@Body() input: DeleteRatePlanCancellationPolicyDailyInputDto) {
    return this.settingsRatePlanService.deleteRatePlanCxlPolicyDaily(input);
  }

  @Post("create-or-update-rate-plan-payment-term-daily")
  async createOrUpdateRatePlanPaymentTermDaily(@Body() input: CreateOrUpdateRatePlanPaymentTermDailyInputDto) {
    return this.settingsRatePlanService.createOrUpdateRatePlanPaymentTermDaily(input);
  }

  @Post("create-or-update-rate-plan-cancellation-policy-daily")
  async createOrUpdateRatePlanCxlPolicyDaily(@Body() input: CreateOrUpdateRatePlanCancellationPolicyDailyInputDto) {
    return this.settingsRatePlanService.createOrUpdateRatePlanCxlPolicyDaily(input);
  }

  @Post("create-or-update-rate-plan-hotel-extras-daily")
  async createOrUpdateRatePlanHotelExtrasDaily(@Body() input: CreateOrUpdateRatePlanExtrasDailyInputDto) {
    return this.settingsRatePlanService.createOrUpdateRatePlanHotelExtrasDaily(input);
  }

  @Post("delete-rate-plan-hotel-extras-daily")
  async deleteRatePlanHotelExtrasDaily(@Body() input: DeleteRatePlanExtrasDailyInputDto) {
    return this.settingsRatePlanService.deleteRatePlanHotelExtrasDaily(input);
  }
}
