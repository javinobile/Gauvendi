import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GlobalPaymentProviderSharedModule } from '@src/modules/global-payment-provider/modules/global-payment-provider-shared.module';
import { HotelPaymentMethodSettingSharedModule } from '@src/modules/hotel-payment-method-setting/modules/hotel-payment-method-setting-shared.module';
import { HotelPaymentTermSharedModule } from '@src/modules/hotel-payment-term/modules/hotel-payment-term-shared.module';
import { RatePlanPaymentTermSettingRepositoryModule } from '@src/modules/rate-plan-payment-term-setting/modules/rate-plan-payment-term-setting-repository.module';
import { HotelsModule } from '@src/modules/hotels/hotels.module';
import { MappingPmsHotelSharedModule } from '@src/modules/mapping-pms-hotel/modules/mapping-pms-hotel-shared.module';
import { ConnectorSharedModule } from '@src/modules/connector/modules/connector-shared.module';
import { PmsModule } from '@src/modules/pms/pms.module';
import { GlobalPaymentMethodController } from '../controllers/global-payment-method.controller';
import { GlobalPaymentMethodService } from '../services/global-payment-method.service';
import { GlobalPaymentMethodSharedModule } from './global-payment-method-shared.module';

@Module({
  imports: [
    GlobalPaymentMethodSharedModule,
    HotelPaymentMethodSettingSharedModule,
    GlobalPaymentProviderSharedModule,
    HotelPaymentTermSharedModule,
    RatePlanPaymentTermSettingRepositoryModule,
    HotelsModule,
    MappingPmsHotelSharedModule,
    ConnectorSharedModule,
    PmsModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5
    }),
    ConfigModule
  ],
  controllers: [GlobalPaymentMethodController],
  providers: [GlobalPaymentMethodService]
})
export class GlobalPaymentMethodModule {}
