import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AvailablePaymentMethodDto, AvailablePaymentMethodFilterDto } from './dtos/payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('available-payment-method')
  @HttpCode(HttpStatus.OK)
  async availablePaymentMethodList(
    @Query() filter: AvailablePaymentMethodFilterDto
  ): Promise<AvailablePaymentMethodDto[]> {
    return await this.paymentService.availablePaymentMethodList(filter);
  }
}
