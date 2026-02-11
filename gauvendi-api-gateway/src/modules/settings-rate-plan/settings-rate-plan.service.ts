import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { DailyRatePlanSellabilityFilterDto } from "./dtos/daily-rate-plan-sellability.dto";
import { DeleteRatePlanDailySellabilityInputDto } from "./dtos/delete-rate-plan-daily-sellability-input.dto";
import { AvailableSalesPlanToDeriveListDto, MappingHotelListDto, MarketSegmentListDto } from "./dtos/mapping-hotel-list.dto";
import {
  CreateOrUpdateRatePlanCancellationPolicyDailyInputDto,
  DeleteRatePlanCancellationPolicyDailyInputDto,
  RatePlanCancellationPolicyDailyFilterDto,
} from "./dtos/rate-plan-cancellation-policy-daily.dto";
import { CreateOrUpdateRatePlanExtrasDailyInputDto, DeleteRatePlanExtrasDailyInputDto, RatePlanHotelExtrasDailyFilterDto } from "./dtos/rate-plan-hotel-extras-daily.dto";
import { CreateOrUpdateRatePlanPaymentTermDailyInputDto, DeleteRatePlanPaymentTermDailyInputDto, RatePlanPaymentTermDailyFilterDto } from "./dtos/rate-plan-payment-term-daily.dto";

@Injectable()
export class SettingsRatePlanService {
  constructor(
    @Inject(PLATFORM_SERVICE)
    private readonly pricingClient: ClientProxy
  ) {}

  async getMappingHotelList(query: MappingHotelListDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.GET_HOTEL_MAPPING_LIST }, query);
  }

  async getMarketSegmentList(query: MarketSegmentListDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.GET_MARKET_SEGMENT_LIST }, query);
  }

  async getSalesPlanSellabilityList(query: any) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN_SELLABILITY.GET_LIST }, query);
  }

  async getSalesPlanDailySellabilityList(query: DailyRatePlanSellabilityFilterDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN_SELLABILITY.GET_DAILY_LIST }, query);
  }

  async createOrUpdateSalesPlanDailySellability(query: DailyRatePlanSellabilityFilterDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN_SELLABILITY.CREATE_OR_UPDATE }, query);
  }

  async getAvailableSalesPlanToDeriveList(query: AvailableSalesPlanToDeriveListDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.GET_AVAILABLE_SALES_PLAN_TO_DERIVE_LIST }, query);
  }

  async getRatePlanCxlPolicyDailyList(query: RatePlanCancellationPolicyDailyFilterDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.GET_RATE_PLAN_CXL_POLICY_DAILY_LIST }, query);
  }

  async getRatePlanPaymentTermDailyList(query: RatePlanPaymentTermDailyFilterDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.GET_RATE_PLAN_PAYMENT_TERM_DAILY_LIST }, query);
  }

  async getRatePlanHotelExtrasDailyList(query: RatePlanHotelExtrasDailyFilterDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.GET_RATE_PLAN_HOTEL_EXTRAS_DAILY_LIST }, query);
  }

  async deleteRatePlanDailySellability(query: DeleteRatePlanDailySellabilityInputDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN_SELLABILITY.DELETE_DAILY }, query);
  }

  async deleteRatePlanPaymentTermDaily(query: DeleteRatePlanPaymentTermDailyInputDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.DELETE_RATE_PLAN_PAYMENT_TERM_DAILY }, query);
  }

  async deleteRatePlanCxlPolicyDaily(query: DeleteRatePlanCancellationPolicyDailyInputDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.DELETE_RATE_PLAN_CXL_POLICY_DAILY }, query);
  }

  async createOrUpdateRatePlanPaymentTermDaily(query: CreateOrUpdateRatePlanPaymentTermDailyInputDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_RATE_PLAN_PAYMENT_TERM_DAILY }, query);
  }

  async createOrUpdateRatePlanCxlPolicyDaily(query: CreateOrUpdateRatePlanCancellationPolicyDailyInputDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_RATE_PLAN_CXL_POLICY_DAILY }, query);
  }

  async createOrUpdateRatePlanHotelExtrasDaily(query: CreateOrUpdateRatePlanExtrasDailyInputDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_RATE_PLAN_HOTEL_EXTRAS_DAILY }, query);
  }

  async deleteRatePlanHotelExtrasDaily(query: DeleteRatePlanExtrasDailyInputDto) {
    return this.pricingClient.send({ cmd: CMD.RATE_PLAN.DELETE_RATE_PLAN_HOTEL_EXTRAS_DAILY }, query);
  }
}
