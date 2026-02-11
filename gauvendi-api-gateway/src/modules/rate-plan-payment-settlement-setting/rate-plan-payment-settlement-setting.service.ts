import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PLATFORM_SERVICE } from '@src/core/clients/platform-client.module';
import { CMD } from '@src/core/constants/cmd.const';
import { RatePlanPaymentSettlementSettingListInput } from './rate-plan-payment-settlement-settings.dto';

@Injectable()
export class RatePlanPaymentSettlementSettingService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getSalesPlanPaymentSettlementSettingList(propertyCode: string) {
    return this.clientProxy.send({ cmd: CMD.RATE_PLAN_PAYMENT_SETTLEMENT_SETTING.LIST }, { propertyCode });
  }

  createOrUpdateRatePlanPaymentSettlementSetting(body: RatePlanPaymentSettlementSettingListInput) {
    return this.clientProxy.send({ cmd: CMD.RATE_PLAN_PAYMENT_SETTLEMENT_SETTING.CREATE_OR_UPDATE }, body);
  }

}
