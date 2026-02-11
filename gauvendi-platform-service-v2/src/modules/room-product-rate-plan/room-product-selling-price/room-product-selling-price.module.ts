import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlanAdjustmentModule } from '@src/core/modules/pricing-calculate/rate-plan-adjustment/rate-plan-adjustment.module';
import { RoomProductPricingModule } from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.module';
import { FeaturePricingModule } from '@src/modules/feature-pricing/feature-pricing.module';
import { RoomProductSharedModule } from '@src/modules/room-product/room-product-shared.module';
import { RoomUnitRepositoryModule } from '@src/modules/room-unit/room-unit-repository.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelConfiguration } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { MappingPmsHotel } from 'src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { RatePlanDailyAdjustment } from 'src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanExtraService } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanFeatureDailyRate } from 'src/core/entities/pricing-entities/rate-plan-feature-daily-rate.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanDailyExtraService } from 'src/core/entities/rate-plan-daily-extra-service.entity';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductBasePriceSetting } from 'src/core/entities/room-product-base-price-setting.entity';
import { RoomProductDailyBasePrice } from 'src/core/entities/room-product-daily-base-price.entity';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductExtra } from 'src/core/entities/room-product-extra.entity';
import { RoomProductFeatureRateAdjustment } from 'src/core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { HotelRepositoryModule } from 'src/modules/hotel/modules/hotel-repository.module';
import { RoomProductRatePlanRepositoryModule } from '../room-product-rate-plan-repository.module';
import { FeatureCalculationService } from './feature-calculation.service';
import { RoomProductSellingPriceController } from './room-product-selling-price.controller';
import { RoomProductSellingPriceService } from './room-product-selling-price.service';
import { RatePlanSellability } from '@src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RatePlanDailySellability } from '@src/core/entities/pricing-entities/rate-plan-daily-sellability.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { Restriction } from '@src/core/entities/restriction.entity';

@Module({
  controllers: [RoomProductSellingPriceController],
  providers: [RoomProductSellingPriceService, FeatureCalculationService],
  imports: [
    TypeOrmModule.forFeature(
      [
        RoomProductDailySellingPrice,
        RoomProductRatePlan,
        RoomProduct,
        RoomProductDailyBasePrice,
        RatePlanDailyAdjustment,
        RatePlanExtraService,
        RatePlanDailyExtraService,
        RatePlan,
        RatePlanFeatureDailyRate,
        RoomProductRetailFeature,
        RoomProductBasePriceSetting,
        RoomProductFeatureRateAdjustment,
        RoomProductAssignedUnit,
        HotelTaxSetting,
        RoomProductExtra,
        HotelTax,
        Hotel,
        MappingPmsHotel,
        HotelConfiguration, 
        HotelAmenity,
        Restriction,
        RatePlanSellability,
        RatePlanDailySellability,
        RoomProductRatePlanAvailabilityAdjustment,
      ],
      DbName.Postgres
    ),

    HotelRepositoryModule,
    RoomProductSharedModule,
    RoomUnitRepositoryModule,
    RoomProductPricingModule,
    RatePlanAdjustmentModule,
    FeaturePricingModule,
    RoomProductRatePlanRepositoryModule,
  ],
  exports: [RoomProductSellingPriceService, FeatureCalculationService]
})
export class RoomProductSellingPriceModule {}
