import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import {
  CreateRatePlanPaymentTermSettingInputDto,
  RatePlanPaymentTermSettingDeleteDto,
  RatePlanPaymentTermSettingFilterDto,
  RatePlanPaymentTermSettingInputDto,
} from "./rate-plan-payment-term-setting.dto";

@Injectable()
export class RatePlanPaymentTermSettingService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getRatePlanPaymentTermSettingList(query: RatePlanPaymentTermSettingFilterDto) {
    return this.clientProxy.send({ cmd: CMD.RATE_PLAN_PAYMENT_TERM_SETTING.GET_LIST }, query);
  }

  updateRatePlanPaymentTermSetting(body: RatePlanPaymentTermSettingInputDto) {
    return this.clientProxy.send({ cmd: CMD.RATE_PLAN_PAYMENT_TERM_SETTING.UPDATE }, body);
  }

  deleteRatePlanPaymentTermSetting(body: RatePlanPaymentTermSettingDeleteDto) {
    return this.clientProxy.send({ cmd: CMD.RATE_PLAN_PAYMENT_TERM_SETTING.DELETE }, body);
  }

  createRatePlanPaymentTermSetting(body: CreateRatePlanPaymentTermSettingInputDto) {
    return this.clientProxy.send({ cmd: CMD.RATE_PLAN_PAYMENT_TERM_SETTING.CREATE }, body);
  }
}
