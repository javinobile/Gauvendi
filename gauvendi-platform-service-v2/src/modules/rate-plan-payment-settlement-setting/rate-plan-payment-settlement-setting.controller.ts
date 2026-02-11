import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { ResponseContent, ResponseData } from '../../core/dtos/common.dto';
import {
  RatePlanPaymentSettlementSettingDto,
  RatePlanPaymentSettlementSettingInputDto
} from './dtos';
import { RatePlanPaymentSettlementSettingService } from './services/rate-plan-payment-settlement-setting.service';
import { RatePlanPaymentSettlementSettingListInput } from './dtos/rate-plan-payment-settlement-setting-input.dto';

@Controller()
export class RatePlanPaymentSettlementSettingController {
  constructor(
    private readonly ratePlanPaymentSettlementSettingService: RatePlanPaymentSettlementSettingService
  ) {}

  @MessagePattern({ cmd: CMD.RATE_PLAN_PAYMENT_SETTLEMENT_SETTING.LIST })
  async ratePlanPaymentSettlementSettingList(
    @Payload() payload: { propertyCode: string }
  ): Promise<ResponseData<RatePlanPaymentSettlementSettingDto>> {
    return this.ratePlanPaymentSettlementSettingService.getSalesPlanPaymentSettlementSettingList(payload.propertyCode);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN_PAYMENT_SETTLEMENT_SETTING.CREATE_OR_UPDATE })
  async createOrUpdateRatePlanPaymentSettlementSetting(
    @Payload() payload: RatePlanPaymentSettlementSettingListInput
  ): Promise<ResponseContent<RatePlanPaymentSettlementSettingDto | null>> {
    return this.ratePlanPaymentSettlementSettingService.createOrUpdateRatePlanPaymentSettlementSetting(payload);
  }
}
