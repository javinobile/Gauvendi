import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileLibrary } from '@src/core/entities/core-entities/file-library.entity';
import { HotelAgeCategory } from '@src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelTax } from '@src/core/entities/hotel-entities/hotel-tax.entity';
import { S3Module } from '@src/core/s3/s3.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelConfiguration } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelPaymentTerm } from 'src/core/entities/hotel-entities/hotel-payment-term.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';
import { CalculateAmenityPricingController } from '../controllers/calculate-amenity-pricing.controller';
import { HotelAmenityPriceRepository } from '../repositories/hotel-amenity-price.repository';
import { HotelAmenityRepository } from '../repositories/hotel-amenity.repository';
import { HotelRetailFeatureRepository } from '../repositories/hotel-retail-feature.repository';
import { HotelRepository } from '../repositories/hotel.repository';
import { AmenityPricingTestService } from '../services/amenity-pricing-test.service';
import { CalculateAmenityPricingService } from '../services/calculate-amenity-pricing.service';
import { HotelService } from '../services/hotel.service';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { PmsModule } from '@src/modules/pms/pms.module';
@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        HotelAmenity,
        HotelAmenityPrice,
        HotelConfiguration,
        HotelPaymentTerm,
        HotelRetailFeature,
        Hotel,
        HotelTaxSetting,
        HotelAmenity,
        FileLibrary,
        HotelAgeCategory,
        HotelTax,
        RatePlanDerivedSetting
      ],
      DbName.Postgres
    ),
    ConfigModule,
    S3Module,
    forwardRef(() => PmsModule) // Import PmsModule to use PmsService which is exported by it
  ],
  controllers: [CalculateAmenityPricingController],
  providers: [
    HotelAmenityPriceRepository,
    HotelAmenityRepository,
    HotelRetailFeatureRepository,
    HotelRepository,

    HotelService,
    CalculateAmenityPricingService,
    AmenityPricingTestService
  ],
  exports: [
    HotelAmenityPriceRepository,
    HotelAmenityRepository,
    HotelRetailFeatureRepository,
    HotelRepository,

    HotelService,
    CalculateAmenityPricingService
  ]
})
export class HotelRepositoryModule {}
