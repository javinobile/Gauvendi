import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from '@src/core/constants/db.const';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { HotelStandardFeature } from '@src/core/entities/hotel-standard-feature.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { Restriction } from '@src/core/entities/restriction.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { PricingCalculateModule } from '@src/core/modules/pricing-calculate/pricing-calculate.module';
import { S3Module } from '@src/core/s3/s3.module';
import { BookingCalculateModule } from '../booking/modules/booking-calculate.module';
import { CountryRepositoryModule } from '../country/contry-repository.module';
import { GuestSharedModule } from '../guest/modules/guest-shared.module';
import { HotelTaxRepositoryModule } from '../hotel-tax/modules/hotel-tax-repository.module';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { IseRecommendationModule } from '../ise-recommendation/ise-recommendation.module';
import { RatePlanSellabilityModule } from '../rate-plan-sellability/modules/rate-plan-sellability.module';
import { RatePlanSettingsModule } from '../rate-plan-settings/modules/rate-plan-settings.module';
import { RestrictionModule } from '../restriction/restriction.module';
import { RoomProductRatePlanRepositoryModule } from '../room-product-rate-plan/room-product-rate-plan-repository.module';
import { RoomProductSharedModule } from '../room-product/room-product-shared.module';
import { RoomUnitRepositoryModule } from '../room-unit/room-unit-repository.module';
import { CppController } from './cpp.controller';
import { CppService } from './cpp.service';

@Module({
  imports: [
    // Register repositories
    HotelRepositoryModule,
    RatePlanSellabilityModule,
    RoomProductRatePlanRepositoryModule,
    RoomProductSharedModule,
    RoomUnitRepositoryModule,
    HotelTaxRepositoryModule,
    RatePlanSettingsModule,
    GuestSharedModule,
    CountryRepositoryModule,
    RestrictionModule,
    S3Module,
    // Register entities
    TypeOrmModule.forFeature(
      [
        RatePlan,
        Restriction,
        RoomProductDailyAvailability,
        HotelStandardFeature,
        RoomProductStandardFeature,
        RoomProduct,
        HotelRetailFeature
      ],
      DB_NAME.POSTGRES
    ),

    // Register services
    PricingCalculateModule,
    IseRecommendationModule,
    BookingCalculateModule
  ],
  controllers: [CppController],
  providers: [CppService],
  exports: [CppService]
})
export class CppModule {}
