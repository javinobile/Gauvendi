import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { GlobalPaymentProviderFilterDto } from '../dtos/global-payment-provider.dto';
import { GlobalPaymentProviderService } from '../services/global-payment-provider.service';

@Controller('global-payment-provider')
export class GlobalPaymentProviderController {
  constructor(private readonly globalPaymentMethodService: GlobalPaymentProviderService) {}

  @MessagePattern({ cmd: CMD.GLOBAL_PAYMENT_PROVIDER.GET_LIST })
  async globalPaymentMethodList(@Payload() filter: GlobalPaymentProviderFilterDto) {
    return await this.globalPaymentMethodService.getGlobalPaymentProviders(filter);
  }
}
