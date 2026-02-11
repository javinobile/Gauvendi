import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import {
  ActivateHotelPaymentMethodInputDto,
  DeactivateHotelPaymentMethodInputDto,
  GeneratePaymentOnboardingUrlInputDto,
  GetGlobalPaymentMethodListDto as GlobalPaymentMethodListDto,
} from "./global-payment-method.dto";

@Injectable()
export class GlobalPaymentMethodService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getGlobalPaymentMethodList(body: GlobalPaymentMethodListDto) {
    return this.clientProxy.send({ cmd: CMD.GLOBAL_PAYMENT_METHOD.GET_LIST }, body);
  }
  activateHotelPaymentMethod(body: ActivateHotelPaymentMethodInputDto) {
    return this.clientProxy.send({ cmd: CMD.GLOBAL_PAYMENT_METHOD.ACTIVATE_HOTEL_PAYMENT_METHOD }, body);
  }

  deactivateHotelPaymentMethod(body: DeactivateHotelPaymentMethodInputDto) {
    return this.clientProxy.send({ cmd: CMD.GLOBAL_PAYMENT_METHOD.DEACTIVATE_HOTEL_PAYMENT_METHOD }, body);
  }

  generatePaymentOnboardingUrl(body: GeneratePaymentOnboardingUrlInputDto) {
    return this.clientProxy.send({ cmd: "generate_payment_onboarding_url" }, body);
  }
}
