import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelAgeCategory } from '@src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenityPrice } from '@src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCityTax } from '@src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from '@src/core/entities/hotel-entities/hotel-tax.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailCategory } from '@src/core/entities/hotel-retail-category.entity';
import { RatePlanDailyAdjustment } from '@src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanDailyExtraService } from '@src/core/entities/rate-plan-daily-extra-service.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductExtraOccupancyRate } from '@src/core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from '@src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { AmenityCalculationModule } from '@src/core/modules/amenity-calculate/amenity-calculation.module';
import { CityTaxCalculateModule } from '@src/core/modules/pricing-calculate/city-tax/city-tax-calculate.module';
import { PricingCalculateModule } from '@src/core/modules/pricing-calculate/pricing-calculate.module';
import { S3Module } from '@src/core/s3/s3.module';
import { HotelAmenityModule } from '@src/modules/hotel-amenity/hotel-amentity.module';
import { HotelAmenitySharedModule } from '@src/modules/hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelCityTaxRepositoryModule } from '@src/modules/hotel-city-tax/hotel-city-tax-repository.module';
import { HotelConfigurationSharedModule } from '@src/modules/hotel-configuration/hotel-configuration-shared.module';
import { HotelTaxRepositoryModule } from '@src/modules/hotel-tax/modules/hotel-tax-repository.module';
import { HotelRepositoryModule } from '@src/modules/hotel/modules/hotel-repository.module';
import { RatePlanExtraServiceRepositoryModule } from '@src/modules/rate-plan-extra-service/modules/rate-plan-extra-service-repository.module';
import { RatePlanSettingsModule } from '@src/modules/rate-plan-settings/modules/rate-plan-settings.module';
import { RatePlanRepositoryModule } from '@src/modules/rate-plan/modules/rate-plan-repository.module';
import { RatePlanV2RepositoryModule } from '@src/modules/rate-plan/modules/rate-plan-v2-repository.module';
import { RoomProductExtraSharedModule } from '@src/modules/room-product-extra/room-product-extra-shared.module';
import { RoomProductRatePlanRepositoryModule } from '@src/modules/room-product-rate-plan/room-product-rate-plan-repository.module';
import { RoomProductRetailFeatureSharedModule } from '@src/modules/room-product-retail-feature/modules/room-product-retail-feature-shared.module';
import { RoomProductStandardFeatureSharedModule } from '@src/modules/room-product-standard-feature/modules/room-product-standard-feature-shared.module';
import { RoomProductSharedModule } from '@src/modules/room-product/room-product-shared.module';
import { TranslationModule } from '@src/modules/translation';
import { HotelRetailCategoryRepository } from '../repositories/hotel-retail-category.repository';
import { HotelTaxSettingRepository } from '../repositories/hotel-tax-setting.repository';
import { RoomProductDailySellingPriceRepository } from '../repositories/room-product-daily-selling-price.repository';
import { BookingAmenityCalculateService } from '../services/booking-amenity-calculate.service';
import { BookingCalculateService } from '../services/booking-calculate.service';
import { BookingCityTaxCalculateService } from '../services/booking-city-tax-calculate.service';
import { RoomProductPricingCalculateService } from '../services/booking-room-product-pricing-calculate.service';
import { BookingTaxService } from '../services/booking-tax.service';
import { CalculateAllocationService } from '../services/calculate-allocation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        Hotel,
        HotelAmenity,
        HotelAmenityPrice,
        HotelConfiguration,
        HotelTaxSetting,
        HotelTax,
        HotelCityTax,
        HotelRetailCategory,
        HotelAgeCategory,
        RoomProduct,
        RoomProductRatePlan,
        RoomProductDailySellingPrice,
        RoomProductExtraOccupancyRate,
        RoomProductRatePlanExtraOccupancyRateAdjustment,
        RoomProductRetailFeature,
        RoomProductStandardFeature,
        RoomProductExtra,
        RatePlan,
        RatePlanExtraService,
        RatePlanDailyExtraService,
        RatePlanDailyAdjustment
      ],
      DbName.Postgres
    ),
    HotelRepositoryModule,
    HotelConfigurationSharedModule,
    HotelAmenitySharedModule,
    RatePlanRepositoryModule,
    RatePlanSettingsModule,
    RoomProductSharedModule,
    RoomProductRatePlanRepositoryModule,
    RoomProductRetailFeatureSharedModule,
    RoomProductStandardFeatureSharedModule,
    S3Module,
    TranslationModule,
    PricingCalculateModule,
    CityTaxCalculateModule,
    HotelAmenityModule,
    HotelTaxRepositoryModule,
    HotelCityTaxRepositoryModule,
    RoomProductExtraSharedModule,
    RatePlanV2RepositoryModule,
    RatePlanExtraServiceRepositoryModule,
    AmenityCalculationModule
  ],
  providers: [
    // Main service
    BookingCalculateService,

    
    HotelTaxSettingRepository,
    HotelRetailCategoryRepository,
    
    RoomProductDailySellingPriceRepository,
    // Dependent services
    RoomProductPricingCalculateService,
    BookingTaxService,
    BookingAmenityCalculateService,
    BookingCityTaxCalculateService,
    
    CalculateAllocationService,
  ],
  exports: [
    BookingCalculateService,
    RoomProductPricingCalculateService,
    BookingTaxService,
    CalculateAllocationService,
  ]
})
export class BookingCalculateModule {}

