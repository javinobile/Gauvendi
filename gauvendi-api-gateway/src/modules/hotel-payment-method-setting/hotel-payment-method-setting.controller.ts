import { Controller, Get, Query } from "@nestjs/common";
import { HotelPaymentMethodSettingFilterDto } from "./hotel-payment-method-setting.dto";
import { HotelPaymentMethodSettingService } from "./hotel-payment-method-setting.service";

@Controller("hotel-payment-method-setting")
export class HotelPaymentMethodSettingController {
  constructor(private readonly hotelPaymentMethodSettingService: HotelPaymentMethodSettingService) {}

  @Get()
  getHotelPaymentMethodSettingList(@Query() query: HotelPaymentMethodSettingFilterDto) {
    return this.hotelPaymentMethodSettingService.getHotelPaymentMethodSettingList(query);
  }
}
