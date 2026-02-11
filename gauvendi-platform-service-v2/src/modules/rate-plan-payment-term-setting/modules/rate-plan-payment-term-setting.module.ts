import { Module } from '@nestjs/common';
import { GlobalPaymentMethodSharedModule } from '@src/modules/global-payment-method/modules/global-payment-method-shared.module';
import { HotelPaymentTermSharedModule } from '@src/modules/hotel-payment-term/modules/hotel-payment-term-shared.module';
import { RatePlanPaymentTermSettingController } from '../controllers/rate-plan-payment-term-setting.controller';
import { RatePlanPaymentTermSettingService } from '../services/rate-plan-payment-term-setting.service';
import { RatePlanPaymentTermSettingRepositoryModule } from './rate-plan-payment-term-setting-repository.module';

@Module({
  imports: [
    RatePlanPaymentTermSettingRepositoryModule,
    GlobalPaymentMethodSharedModule,
    HotelPaymentTermSharedModule
  ],
  controllers: [RatePlanPaymentTermSettingController],
  providers: [RatePlanPaymentTermSettingService],
  exports: [RatePlanPaymentTermSettingService]
})
export class RatePlanPaymentTermSettingModule {}
