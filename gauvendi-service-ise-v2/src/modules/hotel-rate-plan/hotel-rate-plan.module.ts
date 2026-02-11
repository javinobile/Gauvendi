import { Module } from '@nestjs/common';
import { HotelCancellationPolicySharedModule } from '../hotel-cancellation-policy/modules/hotel-cancellation-policy-shared.module';
import { HotelSharedModule } from '../hotel-v2/modules/hotel-shared.module';
import { RatePlanCancellationPolicyDailyRepositoryModule } from '../rate-plan-cancellation-policy-daily/rate-plan-cancellation-policy-daily-repository.module';
import { RatePlanDailyPaymentTermRepositoryModule } from '../rate-plan-daily-payment-term/rate-plan-daily-payment-term-repository.module';
import { HotelRatePlanSharedModule } from './hotel-rate-plan-shared.module';
import { HotelRatePlanController } from './hotel-rate-plan.controller';
import { ExtraServiceSettingsMapper } from './services/extra-service-settings.mapper';
import { ExtraServiceSettingsService } from './services/extra-service-settings.service';
import { HotelPaymentTermMapper } from './services/hotel-payment-term.mapper';
import { HotelRatePlanMapper } from './services/hotel-rate-plan.mapper';
import { HotelRatePlanService } from './services/hotel-rate-plan.service';
import { RatePlanPaymentTermSettingMapper } from './services/rate-plan-payment-term-setting.mapper';
import { SellingRatePlanService } from './services/selling-rate-plan.service';
@Module({
  imports: [
    HotelRatePlanSharedModule,
    HotelSharedModule,
    HotelCancellationPolicySharedModule,
    RatePlanCancellationPolicyDailyRepositoryModule,
    RatePlanDailyPaymentTermRepositoryModule
  ],
  controllers: [HotelRatePlanController],
  providers: [
    HotelRatePlanService,
    ExtraServiceSettingsService,
    ExtraServiceSettingsMapper,
    HotelPaymentTermMapper,
    RatePlanPaymentTermSettingMapper,
    HotelRatePlanMapper,
    SellingRatePlanService
  ],
  exports: [HotelRatePlanService]
})
export class HotelRatePlanModule {}
