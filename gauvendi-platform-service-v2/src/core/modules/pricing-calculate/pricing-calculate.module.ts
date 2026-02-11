import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelAgeCategory } from '@src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenityPrice } from '@src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCityTaxAgeGroup } from '@src/core/entities/hotel-entities/hotel-city-tax-age-group.entity';
import { HotelCityTax } from '@src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { CalculateAmenityPricingService } from '@src/modules/hotel/services/calculate-amenity-pricing.service';
import { RatePlanSettingsModule } from '@src/modules/rate-plan-settings/modules/rate-plan-settings.module';
import { RatePlanV2RepositoryModule } from '@src/modules/rate-plan/modules/rate-plan-v2-repository.module';
import { RoomProductRatePlanRepositoryModule } from '@src/modules/room-product-rate-plan/room-product-rate-plan-repository.module';
import { RoomProductSharedModule } from '@src/modules/room-product/room-product-shared.module';
import { CityTaxCalculateModule } from './city-tax/city-tax-calculate.module';
import { PricingCalculateService } from './pricing-calculate.service';
import { ExtraBedCalculateService } from './services/extra-bed.service';
import { OccupancySurchargeCalculateService } from './services/occupancy-surcharge​-calculate.service';

@Module({
  imports: [
    CityTaxCalculateModule,
    RatePlanV2RepositoryModule,
    RatePlanSettingsModule,
    RoomProductRatePlanRepositoryModule,
    RoomProductSharedModule,
    TypeOrmModule.forFeature(
      [
        RoomProductRatePlan,
        HotelAmenity,
        HotelCityTax,
        RoomProduct,
        RoomProductExtra,
        RatePlanExtraService,
        RatePlan,
        HotelAmenityPrice,
        RatePlanDerivedSetting,
        HotelAgeCategory,
        HotelCityTaxAgeGroup,
        HotelTaxSetting,
      ],
      DbName.Postgres
    )
  ],
  providers: [
    
    OccupancySurchargeCalculateService,
    ExtraBedCalculateService,
    PricingCalculateService,
    CalculateAmenityPricingService
  ],
  exports: [
    PricingCalculateService,
    OccupancySurchargeCalculateService,
    ExtraBedCalculateService,
    
    CalculateAmenityPricingService
  ]
})
export class PricingCalculateModule {}
