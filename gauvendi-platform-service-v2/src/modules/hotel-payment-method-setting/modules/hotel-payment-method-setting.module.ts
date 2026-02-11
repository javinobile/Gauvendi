import { Module } from '@nestjs/common';
import { GlobalPaymentProviderSharedModule } from '@src/modules/global-payment-provider/modules/global-payment-provider-shared.module';
import { HotelPaymentMethodSettingController } from '../controllers/hotel-payment-method-setting.controller';
import { HotelPaymentMethodSettingService } from '../services/hotel-payment-method-setting.service';
import { HotelPaymentMethodSettingSharedModule } from './hotel-payment-method-setting-shared.module';
import { GlobalPaymentMethodSharedModule } from '@src/modules/global-payment-method/modules/global-payment-method-shared.module';

@Module({
  imports: [
    HotelPaymentMethodSettingSharedModule,
    GlobalPaymentProviderSharedModule,
    GlobalPaymentMethodSharedModule
  ],
  controllers: [HotelPaymentMethodSettingController],
  providers: [HotelPaymentMethodSettingService]
})
export class HotelPaymentMethodSettingModule {}
