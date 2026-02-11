import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { GlobalPaymentMethodSharedModule } from '../global-payment-method/modules/global-payment-method-shared.module';
import { HotelCancellationPolicySharedModule } from '../hotel-cancellation-policy/modules/hotel-cancellation-policy-shared.module';
import { HotelTaxRepositoryModule } from '../hotel-tax/modules/hotel-tax-repository.module';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { CalculateAmenityPricingService } from '../hotel/services/calculate-amenity-pricing.service';
import { HotelService } from '../hotel/services/hotel.service';
import { RatePlanExtraServiceRepositoryModule } from '../rate-plan-extra-service/modules/rate-plan-extra-service-repository.module';
import { RatePlanFeatureDailyRateRepositoryModule } from '../rate-plan-feature-daily-rate/modules/rate-plan-feature-daily-rate-repository.module';
import { RatePlanPaymentTermSettingRepositoryModule } from '../rate-plan-payment-term-setting/modules/rate-plan-payment-term-setting-repository.module';
import { RatePlanSettingsModule } from '../rate-plan-settings/modules/rate-plan-settings.module';
import { RatePlanRepositoryModule } from '../rate-plan/modules/rate-plan-repository.module';
import { PricingController } from './controllers/pricing.controller';
import { HotelCancellationPolicyPricingService } from './services/hotel-cancellation-policy-pricing.service';
import { HotelExtrasPricingService } from './services/hotel-extras-pricing.service';
import { HotelTaxPricingService } from './services/hotel-tax-pricing.service';
import { RatePlanFeatureDailyRatePricingService } from './services/rate-plan-feature-daily-rate-prcing.service';
import { RatePlanServicePricingService } from './services/rate-plan-service-pricing.service';
import { HotelTax } from '@src/core/entities/hotel-entities/hotel-tax.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';

@Module({
  imports: [
    S3Module,
    RatePlanExtraServiceRepositoryModule,
    RatePlanRepositoryModule,
    RatePlanFeatureDailyRateRepositoryModule,
    HotelRepositoryModule,
    HotelCancellationPolicySharedModule,
    RatePlanPaymentTermSettingRepositoryModule,
    HotelTaxRepositoryModule,
    GlobalPaymentMethodSharedModule,
    RatePlanSettingsModule,
    TypeOrmModule.forFeature([RoomProductExtra, RatePlan, HotelAmenity, HotelTax, HotelTaxSetting], DbName.Postgres)
  ],
  controllers: [PricingController],
  providers: [
    RatePlanServicePricingService,
    RatePlanFeatureDailyRatePricingService,
    HotelCancellationPolicyPricingService,
    HotelExtrasPricingService,
    HotelTaxPricingService,
    CalculateAmenityPricingService,
  ]
})
export class PricingModule {}
