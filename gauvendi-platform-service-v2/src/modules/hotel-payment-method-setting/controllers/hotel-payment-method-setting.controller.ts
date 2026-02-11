import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { HotelPaymentMethodSettingFilterDto } from '../dtos/hotel-payment-method-setting.dto';
import { HotelPaymentMethodSettingService } from '../services/hotel-payment-method-setting.service';

@Controller('hotel-payment-method-setting')
export class HotelPaymentMethodSettingController {
  constructor(
    private readonly hotelPaymentMethodSettingService: HotelPaymentMethodSettingService
  ) {}

  @MessagePattern({ cmd: CMD.HOTEL_PAYMENT_METHOD_SETTING.GET_LIST })
  async hotelPaymentMethodSettingList(@Payload() filter: HotelPaymentMethodSettingFilterDto) {
    return await this.hotelPaymentMethodSettingService.getHotelPaymentMethodSettings(filter);
  }
}
