import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { ActivateHotelPaymentMethodInputDto, DeactivateHotelPaymentMethodInputDto, GeneratePaymentOnboardingUrlInputDto, GlobalPaymentMethodFilterDto } from '../dtos/global-payment-method.dto';
import { GlobalPaymentMethodService } from '../services/global-payment-method.service';

@Controller('global-payment-method')
export class GlobalPaymentMethodController {
  constructor(private readonly globalPaymentMethodService: GlobalPaymentMethodService) {}

  @MessagePattern({ cmd: CMD.GLOBAL_PAYMENT_METHOD.GET_LIST })
  async globalPaymentMethodList(@Payload() filter: GlobalPaymentMethodFilterDto) {
    return await this.globalPaymentMethodService.getGlobalPaymentMethods(filter);
  }

  @MessagePattern({ cmd: CMD.GLOBAL_PAYMENT_METHOD.ACTIVATE_HOTEL_PAYMENT_METHOD })
  async activateHotelPaymentMethod(@Payload() input: ActivateHotelPaymentMethodInputDto) {
    return await this.globalPaymentMethodService.activateHotelPaymentMethod(input);
  }

  @MessagePattern({ cmd: CMD.GLOBAL_PAYMENT_METHOD.DEACTIVATE_HOTEL_PAYMENT_METHOD })
  async deactivateHotelPaymentMethod(@Payload() input: DeactivateHotelPaymentMethodInputDto) {
    return await this.globalPaymentMethodService.deactivateHotelPaymentMethod(input);
  }

  @MessagePattern({ cmd: 'generate_payment_onboarding_url' })
  async generatePaymentOnboardingUrl(@Payload() input: GeneratePaymentOnboardingUrlInputDto) {
    return await this.globalPaymentMethodService.generatePaymentOnboardingUrl(input);
  }
}
