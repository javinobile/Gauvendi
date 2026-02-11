import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ActivateHotelPaymentMethodInputDto, DeactivateHotelPaymentMethodInputDto, GeneratePaymentOnboardingUrlInputDto, GetGlobalPaymentMethodListDto } from "./global-payment-method.dto";
import { GlobalPaymentMethodService } from "./global-payment-method.service";
@Controller("global-payment-method")
export class GlobalPaymentMethodController {
  constructor(private readonly globalPaymentMethodService: GlobalPaymentMethodService) {}

  @Get("list")
  getGlobalPaymentMethodList(@Query() query: GetGlobalPaymentMethodListDto) {
    return this.globalPaymentMethodService.getGlobalPaymentMethodList(query);
  }
  @Post("activate-hotel-payment-method")
  activateHotelPaymentMethod(@Body() body: ActivateHotelPaymentMethodInputDto) {
    return this.globalPaymentMethodService.activateHotelPaymentMethod(body);
  }

  @Post("deactivate-hotel-payment-method")
  updateHotelPaymentMethod(@Body() body: DeactivateHotelPaymentMethodInputDto) {
    return this.globalPaymentMethodService.deactivateHotelPaymentMethod(body);
  }

  @Post("generate-payment-onboarding-link")
  generatePaymentOnboardingUrl(@Body() body: GeneratePaymentOnboardingUrlInputDto) {
    return this.globalPaymentMethodService.generatePaymentOnboardingUrl(body);
  }
}
