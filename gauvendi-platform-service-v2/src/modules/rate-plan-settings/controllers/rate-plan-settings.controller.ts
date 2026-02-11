import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import {
  AvailableSalesPlanToDeriveListDto,
  MappingHotelListDto,
  MarketSegmentListDto,
  SalesPlanSellabilityListDto
} from '../dtos/mapping-hotel-list.dto';
import {
  CreateOrUpdateRatePlanCancellationPolicyDailyInputDto,
  DeleteRatePlanCancellationPolicyDailyInputDto,
  RatePlanCancellationPolicyDailyFilterDto
} from '../dtos/rate-plan-cancellation-policy-daily.dto';
import {
  CreateOrUpdateRatePlanExtrasDailyInputDto,
  DeleteRatePlanExtrasDailyInputDto,
  RatePlanHotelExtrasDailyFilterDto
} from '../dtos/rate-plan-hotel-extras-daily.dto';
import {
  CreateOrUpdateRatePlanPaymentTermDailyInputDto,
  DeleteRatePlanPaymentTermDailyInputDto,
  RatePlanPaymentTermDailyFilterDto
} from '../dtos/rate-plan-payment-term-daily.dto';
import { RatePlanSettingsService } from '../services/rate-plan-settings.service';

@Controller()
export class RatePlanSettingsController {
  constructor(private readonly ratePlanSettingsService: RatePlanSettingsService) {}

  @MessagePattern({ cmd: CMD.PRICING.GET_HOTEL_MAPPING_LIST })
  async getHotelMappingList(@Payload() queryPayload: MappingHotelListDto) {
    return this.ratePlanSettingsService.getHotelMappingList(queryPayload);
  }

  @MessagePattern({ cmd: CMD.PRICING.GET_MARKET_SEGMENT_LIST })
  async getMarketSegmentList(@Payload() queryPayload: MarketSegmentListDto) {
    return this.ratePlanSettingsService.getMarketSegmentList(queryPayload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN_SELLABILITY.GET_LIST })
  async getSalesPlanSellabilityList(@Payload() queryPayload: SalesPlanSellabilityListDto) {
    return this.ratePlanSettingsService.getSalesPlanSellabilityList(queryPayload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_AVAILABLE_SALES_PLAN_TO_DERIVE_LIST })
  async getAvailableSalesPlanToDeriveList(
    @Payload() queryPayload: AvailableSalesPlanToDeriveListDto
  ) {
    return this.ratePlanSettingsService.getAvailableSalesPlanToDeriveList(queryPayload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_RATE_PLAN_CXL_POLICY_DAILY_LIST })
  async upsertSalesPlanSellAbility(@Payload() payload: RatePlanCancellationPolicyDailyFilterDto) {
    return this.ratePlanSettingsService.getRatePlanCancellationPolicyDailyList(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_RATE_PLAN_PAYMENT_TERM_DAILY_LIST })
  async getRatePlanPaymentTermDailyList(@Payload() payload: RatePlanPaymentTermDailyFilterDto) {
    return this.ratePlanSettingsService.getRatePlanPaymentTermDailyList(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_RATE_PLAN_HOTEL_EXTRAS_DAILY_LIST })
  async getRatePlanHotelExtrasDailyList(@Payload() payload: RatePlanHotelExtrasDailyFilterDto) {
    return this.ratePlanSettingsService.getRatePlanHotelExtrasDailyList(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.DELETE_RATE_PLAN_PAYMENT_TERM_DAILY })
  async deleteRatePlanPaymentTermDaily(@Payload() payload: DeleteRatePlanPaymentTermDailyInputDto) {
    return this.ratePlanSettingsService.deleteRatePlanPaymentTermDaily(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_RATE_PLAN_PAYMENT_TERM_DAILY })
  async createOrUpdateRatePlanPaymentTermDaily(
    @Payload() payload: CreateOrUpdateRatePlanPaymentTermDailyInputDto
  ) {
    return this.ratePlanSettingsService.createOrUpdateRatePlanPaymentTermDaily(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_RATE_PLAN_CXL_POLICY_DAILY })
  async createOrUpdateRatePlanCancellationPolicyDaily(
    @Payload() payload: CreateOrUpdateRatePlanCancellationPolicyDailyInputDto
  ) {
    return this.ratePlanSettingsService.createOrUpdateRatePlanCancellationPolicyDaily(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.DELETE_RATE_PLAN_CXL_POLICY_DAILY })
  async deleteRatePlanCancellationPolicyDaily(
    @Payload() payload: DeleteRatePlanCancellationPolicyDailyInputDto
  ) {
    return this.ratePlanSettingsService.deleteRatePlanCancellationPolicyDaily(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.CREATE_OR_UPDATE_RATE_PLAN_HOTEL_EXTRAS_DAILY })
  async createOrUpdateRatePlanExtrasDaily(
    @Payload() payload: CreateOrUpdateRatePlanExtrasDailyInputDto
  ) {
    return this.ratePlanSettingsService.createOrUpdateRatePlanHotelExtrasDaily(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.DELETE_RATE_PLAN_HOTEL_EXTRAS_DAILY })
  async deleteRatePlanExtrasDaily(@Payload() payload: DeleteRatePlanExtrasDailyInputDto) {
    return this.ratePlanSettingsService.deleteRatePlanExtrasDaily(payload);
  }
}
