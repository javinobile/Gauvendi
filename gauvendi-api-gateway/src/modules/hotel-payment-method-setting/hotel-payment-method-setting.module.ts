import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { HotelPaymentMethodSettingController } from "./hotel-payment-method-setting.controller";
import { HotelPaymentMethodSettingService } from "./hotel-payment-method-setting.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [HotelPaymentMethodSettingController],
  providers: [HotelPaymentMethodSettingService],
})
export class HotelPaymentMethodSettingModule {}
