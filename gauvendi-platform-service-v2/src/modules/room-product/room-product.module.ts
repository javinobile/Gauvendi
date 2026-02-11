import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelStandardFeature } from '@src/core/entities/hotel-standard-feature.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductFeatureRateAdjustment } from '@src/core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { PricingCalculateModule } from '@src/core/modules/pricing-calculate/pricing-calculate.module';
import { RoomProductPricingModule } from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.module';
import { FeaturePricingModule } from '@src/modules/feature-pricing/feature-pricing.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';
import { Restriction } from 'src/core/entities/restriction.entity';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductBasePriceSetting } from 'src/core/entities/room-product-base-price-setting.entity';
import { RoomProductExtraOccupancyRate } from 'src/core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProductExtra } from 'src/core/entities/room-product-extra.entity';
import { RoomProductImage } from 'src/core/entities/room-product-image.entity';
import { RoomProductMapping } from 'src/core/entities/room-product-mapping.entity';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from 'src/core/entities/room-product-standard-feature.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { QUEUE_NAMES } from 'src/core/queue/queue.constant';
import { S3Module } from 'src/core/s3/s3.module';
import { HotelRepository } from '../hotel/repositories/hotel.repository';
import { PmsModule } from '../pms/pms.module';
import { RatePlanSellabilityModule } from '../rate-plan-sellability/modules/rate-plan-sellability.module';
import { RoomProductAvailabilityModule } from '../room-product-availability/room-product-availability.module';
import { RoomProductPricingMethodDetailModule } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.module';
import { RoomProductSellingPriceModule } from '../room-product-rate-plan/room-product-selling-price/room-product-selling-price.module';
import { TranslationModule } from '../translation';
import { RoomProductRfcService } from './room-product-rfc.service';
import { RoomProductSharedModule } from './room-product-shared.module';
import { RoomProductController } from './room-product.controller';
import { RoomProductRepository } from './room-product.repository';
import { RoomProductService } from './room-product.service';
import { GoogleInterfaceClientModule } from '@src/core/client/google-interface-client.module';
import { RoomUnitRetailFeature } from '@src/core/entities/room-unit-retail-feature.entity';

@Module({
  controllers: [RoomProductController],
  providers: [RoomProductService, RoomProductRfcService, RoomProductRepository, HotelRepository],
  imports: [
    RoomProductSharedModule,
    TranslationModule,
    RoomProductSellingPriceModule,
    RoomProductPricingMethodDetailModule,
    PricingCalculateModule,
    RatePlanSellabilityModule,

    FeaturePricingModule,
    RoomProductPricingModule,

    TypeOrmModule.forFeature(
      [
        RoomProduct,
        RoomProductDailyAvailability,
        Restriction,
        RoomProductAssignedUnit,
        RoomProductRetailFeature,
        RoomProductExtra,
        RoomProductImage,
        HotelRetailFeature,
        RoomProductBasePriceSetting,
        RoomProductExtraOccupancyRate,
        RoomProductMapping,
        RoomProductRatePlan,
        RatePlan,
        RoomProductStandardFeature,
        RoomProductPricingMethodDetail,
        RoomProductMappingPms,
        RoomProductFeatureRateAdjustment,
        RoomUnit,
        RoomUnitAvailability,
        Hotel,
        HotelTaxSetting,
        RoomProductDailySellingPrice,
        RoomProductRatePlanAvailabilityAdjustment,
        HotelStandardFeature,
        Reservation,
        RoomUnitRetailFeature
      ],
      DbName.Postgres
    ),
    PmsModule,
    S3Module,
    RoomProductSellingPriceModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ROOM_PRODUCT_PRICING
    }),
    RoomProductAvailabilityModule,
    GoogleInterfaceClientModule
  ],
  exports: [RoomProductService]
})
export class RoomProductModule {}
