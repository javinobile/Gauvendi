import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { GlobalPaymentProviderListDto } from "./global-payment-provider.dto";

@Injectable()
export class GlobalPaymentProviderService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getGlobalPaymentProviderList(body: GlobalPaymentProviderListDto) {
    return this.clientProxy.send({ cmd: CMD.GLOBAL_PAYMENT_PROVIDER.GET_LIST }, body);
  }
}
