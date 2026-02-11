import { Body, Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { HotelCancellationPolicyChangeDefaultPricingInputDto } from "./dtos/hotel-cancellation-policy-change-default-pricing-input.dto";
import { HotelCancellationPolicyFilterDto } from "./dtos/hotel-cancellation-policy-pricing-filter.dto";
import { HotelCancellationPolicyPricingInputDto } from "./dtos/hotel-cancellation-policy-pricing-input.dto";
import { HotelExtrasListPricingFilterDto } from "./dtos/hotel-extras-pricing.dto";
import { HotelTaxFilterDto } from "./dtos/property-tax-pricing-filter.dto";
import { RatePlanFeatureWithDailyRateListFilterDto } from "./dtos/rate-plan-feature-with-daily-rate-pricing-filter.dto";
import { RatePlanServiceDeleteInputDto, RatePlanServiceInputDto, RatePlanServiceListPricingFilterDto } from "./dtos/rate-plan-service-pricing.dto";
import { UpdateTaxSettingsPricingInputDto } from "./dtos/update-tax-settings-pricing-input.dto";
@Injectable()
export class PricingService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly pricingClient: ClientProxy
    // @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  ratePlanServiceList(query: RatePlanServiceListPricingFilterDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.GET_RATE_PLAN_SERVICE_LIST }, query);
  }

  createRatePlanService(@Body() body: RatePlanServiceInputDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.CREATE_RATE_PLAN_SERVICE }, body);
  }

  deleteRatePlanService(filter: RatePlanServiceDeleteInputDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.DELETE_RATE_PLAN_SERVICE }, filter);
  }

  async ratePlanFeatureDailyRateList(query: RatePlanFeatureWithDailyRateListFilterDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.GET_RATE_PLAN_FEATURE_DAILY_RATE_LIST }, query);
  }

  async hotelCancellationPolicyList(query: HotelCancellationPolicyFilterDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.GET_HOTEL_CANCELLATION_POLICY_LIST }, query);
  }

  async hotelCancellationPolicyChangeDefault(dto: HotelCancellationPolicyChangeDefaultPricingInputDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.CHANGE_DEFAULT_HOTEL_CANCELLATION_POLICY }, dto);
  }

  async hotelCancellationPolicyCreateOrUpdate(dto: HotelCancellationPolicyPricingInputDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.CREATE_OR_UPDATE_HOTEL_CANCELLATION_POLICY }, dto);
  }

  async hotelExtrasList(query: HotelExtrasListPricingFilterDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.GET_HOTEL_EXTRAS_LIST }, query);
  }

  async hotelTaxList(query: HotelTaxFilterDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.GET_HOTEL_TAX_LIST }, query);
  }

  async hotelTaxUpdateSettings(dto: UpdateTaxSettingsPricingInputDto) {
    return this.pricingClient.send({ cmd: CMD.PRICING.UPDATE_HOTEL_TAX_SETTINGS }, dto);
  }
}
