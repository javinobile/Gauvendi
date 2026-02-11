import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { ApaleoRatePlanPmsMapping } from '@src/core/entities/apaleo-entities/apaleo-rate-plan-pms-mapping.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { HotelAmenityPrice } from '@src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCancellationPolicy } from '@src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RatePlanDailyAdjustment } from '@src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanPaymentTermSetting } from '@src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlanTranslation } from '@src/core/entities/pricing-entities/rate-plan-translation.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanDailyExtraService } from '@src/core/entities/rate-plan-daily-extra-service.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductBasePriceSetting } from '@src/core/entities/room-product-base-price-setting.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomProductTypeMapping } from '@src/core/entities/room-product-type-mapping.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { PricingCalculateModule } from '@src/core/modules/pricing-calculate/pricing-calculate.module';
import { RoomProductPricingModule } from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.module';
import { RedisModule } from '@src/core/redis';
import { FeaturePricingModule } from '@src/modules/feature-pricing/feature-pricing.module';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { RatePlanSellabilityModule } from '../rate-plan-sellability/modules/rate-plan-sellability.module';
import { RoomProductPricingMethodDetailModule } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.module';
import { RoomProductRatePlanRepositoryModule } from '../room-product-rate-plan/room-product-rate-plan-repository.module';
import { RatePlansController } from './rate-plans.controller';
import { RatePlansService } from './rate-plans.service';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';

@Module({
  controllers: [RatePlansController],
  providers: [RatePlansService],
  imports: [
    RedisModule,
    TypeOrmModule.forFeature(
      [
        RatePlan,
        RatePlanTranslation,
        RatePlanDerivedSetting,
        RoomProductRatePlan,
        HotelCancellationPolicy,
        HotelPaymentTerm,
        RoomProduct,
        Hotel,
        RoomProductDailySellingPrice,
        RoomProductDailyAvailability,
        RoomProductMapping,
        RoomProductRetailFeature,
        RoomProductStandardFeature,
        RoomProductAssignedUnit,
        RoomProductRatePlanAvailabilityAdjustment,
        RoomProductPricingMethodDetail,
        HotelAmenity,
        HotelAmenityPrice,
        HotelTaxSetting,

        RoomProductExtra,
        RatePlanExtraService,
        RatePlanDailyAdjustment,
        RatePlanDailyExtraService,
        HotelConfiguration,
        RatePlan,
        RoomUnit,
        RatePlanPaymentTermSetting,
        ApaleoRatePlanPmsMapping,
        RoomProductBasePriceSetting,
        RoomProductTypeMapping,
        Reservation,
        RoomUnitAvailability
      ],
      DbName.Postgres
    ),
    PricingCalculateModule,
    RoomProductPricingMethodDetailModule,
    HotelRepositoryModule,
    RatePlanSellabilityModule,
    RoomProductPricingModule,
    RoomProductRatePlanRepositoryModule,
    FeaturePricingModule
  ]
})
export class RatePlansModule {}
