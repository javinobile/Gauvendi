import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { HotelPaymentMethodSettingFilterDto } from "./hotel-payment-method-setting.dto";

@Injectable()
export class HotelPaymentMethodSettingService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getHotelPaymentMethodSettingList(query: HotelPaymentMethodSettingFilterDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_PAYMENT_METHOD_SETTING.GET_LIST }, query);
  }
}
