import { HotelConfiguration } from '@entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { RatePlanDailySellability } from '@entities/pricing-entities/rate-plan-daily-sellability.entity';
import { RatePlanExtraService } from '@entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from '@entities/pricing-entities/rate-plan.entity';
import { RatePlanDailyExtraService } from '@entities/rate-plan-daily-extra-service.entity';
import { Restriction } from '@entities/restriction.entity';
import { RoomProductDailySellingPrice } from '@entities/room-product-daily-selling-price.entity';
import { RoomProductExtra } from '@entities/room-product-extra.entity';
import { RoomProductRatePlan } from '@entities/room-product-rate-plan.entity';
import { RoomProduct } from '@entities/room-product.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheModule } from '@src/core/cache/redis-cache.module';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { Event } from '@src/core/entities/hotel-entities/event.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { HotelStandardFeature } from '@src/core/entities/hotel-standard-feature.entity';
import { RatePlanSellability } from '@src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductImage } from '@src/core/entities/room-product-image.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { AmenityCalculationModule } from '@src/core/modules/amenity-calculate/amenity-calculation.module';
import { CityTaxCalculateModule } from '@src/core/modules/pricing-calculate/city-tax/city-tax-calculate.module';
import { PricingCalculateModule } from '@src/core/modules/pricing-calculate/pricing-calculate.module';
import { S3Module } from '@src/core/s3/s3.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { AiRecommendationModule } from '../ai-recommendation/ai-recommendation.module';
import { HotelCityTaxRepositoryModule } from '../hotel-city-tax/hotel-city-tax-repository.module';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { RoomProductAvailabilityModule } from '../room-product-availability/room-product-availability.module';
import { IseRecommendationController } from './ise-recommendation.controller';
import { IseRecommendationService } from './ise-recommendation.service';
import { StayOptionService } from './stay-option.service';
import { RestrictionModule } from '../restriction/restriction.module';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';

@Module({
  controllers: [IseRecommendationController],
  providers: [IseRecommendationService, StayOptionService],
  imports: [
    TypeOrmModule.forFeature(
      [
        Hotel,
        HotelConfiguration,
        RoomProduct,
        RatePlan,
        RoomProductRatePlan,
        Restriction,
        RatePlanDailySellability,
        RoomProductDailySellingPrice,
        RatePlanDailyExtraService,
        RatePlanExtraService,
        RoomProductExtra,
        Reservation,
        Booking,
        Event,
        HotelRetailFeature,
        RoomProductDailyAvailability,
        RatePlanSellability,
        RatePlanDailySellability,
        RoomProductRatePlanAvailabilityAdjustment,
        RoomProductImage,
        RoomProductRetailFeature,
        RoomProductStandardFeature,
        RoomProductAssignedUnit,
        HotelStandardFeature,
        RatePlanDerivedSetting
      ],
      DbName.Postgres
    ),
    HotelRepositoryModule,
    HotelCityTaxRepositoryModule,
    RoomProductAvailabilityModule,
    AiRecommendationModule,
    S3Module,
    RedisCacheModule,
    PricingCalculateModule,
    CityTaxCalculateModule,
    AmenityCalculationModule,
    RestrictionModule
  ],
  exports: [StayOptionService, IseRecommendationService]
})
export class IseRecommendationModule {}
