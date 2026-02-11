import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCancellationPolicy } from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelPaymentTerm } from 'src/core/entities/hotel-entities/hotel-payment-term.entity';
import { RatePlanDerivedSetting } from 'src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanExtraService } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanPaymentTermSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanCxlPolicyDaily } from 'src/core/entities/rate-plan-cxl-policy-daily.entity';
import { RatePlanDailyPaymentTerm } from 'src/core/entities/rate-plan-daily-payment-term.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from 'src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { HotelSharedModule } from '../hotel-v2/modules/hotel-shared.module';
import { HotelAmenityRepository } from './repositories/hotel-amenity.repository';
import { HotelPaymentTermRepository } from './repositories/hotel-payment-term.repository';
import { RatePlanDailyPaymentTermRepository } from './repositories/rate-plan-daily-payment-term.repository';
import { RatePlanDerivedSettingRepository } from './repositories/rate-plan-derived-setting.repository';
import { RatePlanExtraServicesRepository } from './repositories/rate-plan-extra-services.repository';
import { RatePlanPaymentTermSettingsRepository } from './repositories/rate-plan-payment-term-settings.repository';
import { RatePlanRepository } from './repositories/rate-plan.repository';
import { RoomProductRatePlanRepository } from './repositories/room-product-rate-plan.repository';
import { RoomProductRepository } from './repositories/room-product.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        HotelCancellationPolicy,
        HotelAmenity,
        HotelPaymentTerm,
        RatePlanCxlPolicyDaily,
        RatePlanDailyPaymentTerm,
        RatePlanDerivedSetting,
        RatePlanExtraService,
        RatePlanPaymentTermSetting,
        RatePlan,
        RoomProductRatePlan,
        RoomProductRatePlanExtraOccupancyRateAdjustment,
        RoomProduct
      ],
      DB_NAME.POSTGRES
    ),
    ConfigModule,
    HotelSharedModule
  ],
  providers: [
    HotelAmenityRepository,
    HotelPaymentTermRepository,
    RatePlanDailyPaymentTermRepository,
    RatePlanDerivedSettingRepository,
    RatePlanExtraServicesRepository,
    RatePlanPaymentTermSettingsRepository,
    RatePlanRepository,
    RoomProductRatePlanRepository,
    RoomProductRepository
  ],
  exports: [
    HotelAmenityRepository,
    HotelPaymentTermRepository,
    RatePlanDailyPaymentTermRepository,
    RatePlanDerivedSettingRepository,
    RatePlanExtraServicesRepository,
    RatePlanPaymentTermSettingsRepository,
    RatePlanRepository,
    RoomProductRatePlanRepository,
    RoomProductRepository
  ]
})
export class HotelRatePlanSharedModule {}
