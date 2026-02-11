import { Controller, Get, Query } from "@nestjs/common";
import { GlobalPaymentProviderListDto } from "./global-payment-provider.dto";
import { GlobalPaymentProviderService } from "./global-payment-provider.service";
@Controller("global-payment-provider")
export class GlobalPaymentProviderController {
  constructor(private readonly globalPaymentProviderService: GlobalPaymentProviderService) {}

  @Get("list")
  getGlobalPaymentProviderList(@Query() query: GlobalPaymentProviderListDto) {
    return this.globalPaymentProviderService.getGlobalPaymentProviderList(query);
  }
}
