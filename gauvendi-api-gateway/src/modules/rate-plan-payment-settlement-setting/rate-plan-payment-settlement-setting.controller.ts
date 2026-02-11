import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RatePlanPaymentSettlementSettingService } from './rate-plan-payment-settlement-setting.service';
import { RatePlanPaymentSettlementSettingListInput } from './rate-plan-payment-settlement-settings.dto';

@Controller('rate-plan-payment-settlement-setting')
export class RatePlanPaymentSettlementSettingController {
  constructor(private readonly ratePlanPaymentSettlementSettingService: RatePlanPaymentSettlementSettingService) {}

  @Get('')
  async salesPlanPaymentSettlementSettingList(@Query('propertyCode') propertyCode: string) {
    return this.ratePlanPaymentSettlementSettingService.getSalesPlanPaymentSettlementSettingList(propertyCode);
  }

  @Post('')
  async createOrUpdateRatePlanPaymentSettlementSetting(@Body() body: RatePlanPaymentSettlementSettingListInput) {
    return this.ratePlanPaymentSettlementSettingService.createOrUpdateRatePlanPaymentSettlementSetting(body);
  }
}
