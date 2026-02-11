import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { CalculateAllocationService } from 'src/core/services/calculate-allocation.service';
import { PaymentModule } from 'src/payment/payment.module';
import { HotelConfigurationSharedModule } from '../hotel-configuration/hotel-configuration-shared.module';
import { RatePlanSharedModule } from '../hotel-rate-plan/rate-plan-shared.module';
import { HotelSharedModule } from '../hotel-v2/modules/hotel-shared.module';

import { PlatformClientModule } from 'src/core/clients/platform-client.module';
import { HotelAgeCategory } from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { AmenityCalculateModule } from 'src/core/modules/amenity-calculate/amenity-calculate.module';
import { S3Module } from 'src/core/s3/s3.module';
import { BookingHotelAmenityService } from '../../core/modules/amenity-calculate/booking-hotel-amentity.service';
import { HotelAmenityModule } from '../hotel-amenity/modules/hotel-amenity.module';
import { HotelCityTaxRepositoryModule } from '../hotel-city-tax/hotel-city-tax-repository.module';
import { HotelRatePlanSharedModule } from '../hotel-rate-plan/hotel-rate-plan-shared.module';
import { HotelRatePlanModule } from '../hotel-rate-plan/hotel-rate-plan.module';
import { SellingRatePlanModule } from '../hotel-rate-plan/selling-rate-plan.module';
import { HotelRetailCategorySharedModule } from '../hotel-retail-category/hotel-retail-category-shared.module';
import { HotelRetailFeaturesModule } from '../hotel-retail-features/hotel-retail-features.module';
import { HotelTaxSettingRepositoryModule } from '../hotel-tax-settings/hotel-tax-setting-repository.module';
import { HotelTaxRepositoryModule } from '../hotel-tax/hotel-tax-repository.module';
import { HotelModule } from '../hotel-v2/modules/hotel.module';
import { RatePlanDailyAdjustmentRepositoryModule } from '../rate-plan-daily-adjustment/rate-plan-daily-adjustment-repository.module';
import { RatePlanExtraServicesRepositoryModule } from '../rate-plan-extra-services/rate-plan-extra-services-repository.module';
import { RoomProductDailySellingPriceRepositoryModule } from '../room-product-daily-selling-price/room-product-repository.module';
import { RoomProductExtraRepositoryModule } from '../room-product-extra/room-product-extra-repository.module';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentRepositoryModule } from '../room-product-rate-plan-extra-occupancy-rate-adjustment/room-product-rate-plan-extra-occupancy-rate-adjustment-repository.module';
import { RoomProductRatePlanRepositoryModule } from '../room-product-rate-plan/room-product-rate-plan-repository.module';
import { RoomProductRetailFeatureSharedModule } from '../room-product-retail-feature/modules/room-product-retail-feature-shared.module';
import { RoomProductStandardFeatureSharedModule } from '../room-product-standard-feature/modules/room-product-standard-feature-shared.module';
import { RoomProductSharedModule } from '../room-product/modules/room-product-shared.module';
import { TranslationSharedModule } from '../translation/modules/translation-shared.module';
import { BookingCalculateService } from './booking-calculate.service';
import { BookingTaxService } from './booking-tax.service';
import { BookingCalculateController } from './controllers/booking-calculate.controller';
import { BookingCityTaxCalculateService } from './services/booking-city-tax-calculate.service';
import { RoomProductPricingCalculateService } from './services/booking-room-product-pricing-calculate.service';
import { OccupancySurchargeCalculateService } from './services/occupancy-surcharge​-calculate.service';
import { RoomProductRatePlanExtraOccupancyService } from './services/room-product-rate-plan-extra-occupancy.service';
@Module({
  imports: [
    PaymentModule,
    HotelRatePlanSharedModule,
    TypeOrmModule.forFeature([RoomProductRatePlan, HotelAmenityPrice, HotelAgeCategory], DB_NAME.POSTGRES),
    HotelConfigurationSharedModule,
    RoomProductDailySellingPriceRepositoryModule,
    HotelSharedModule,
    RoomProductSharedModule,
    RatePlanSharedModule,
    RoomProductRatePlanRepositoryModule,
    RatePlanDailyAdjustmentRepositoryModule,
    RatePlanExtraServicesRepositoryModule,
    HotelRetailFeaturesModule,
    RoomProductRatePlanExtraOccupancyRateAdjustmentRepositoryModule,
    HotelAmenityModule,
    RoomProductExtraRepositoryModule,
    PlatformClientModule,
    HotelModule,
    SellingRatePlanModule,
    RoomProductRetailFeatureSharedModule,
    RoomProductStandardFeatureSharedModule,
    HotelCityTaxRepositoryModule,
    HotelTaxRepositoryModule,
    HotelRatePlanModule,
    S3Module,
    HotelRetailCategorySharedModule,
    AmenityCalculateModule,
    HotelTaxSettingRepositoryModule,
    TranslationSharedModule
  ],
  controllers: [BookingCalculateController],
  providers: [
    CalculateAllocationService,
    RoomProductPricingCalculateService,
    BookingCalculateService,
    RoomProductRatePlanExtraOccupancyService,
    OccupancySurchargeCalculateService,
    BookingTaxService,
    BookingCityTaxCalculateService,
    BookingHotelAmenityService
  ],
  exports: [BookingCalculateService]
})
export class BookingCalculateModule {}
