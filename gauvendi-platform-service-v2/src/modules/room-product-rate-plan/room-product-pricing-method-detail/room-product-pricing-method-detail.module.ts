import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { Connector } from '@src/core/entities/hotel-entities/connector.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RatePlanAdjustmentModule } from '@src/core/modules/pricing-calculate/rate-plan-adjustment/rate-plan-adjustment.module';
import { RoomProductPricingModule } from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.module';
import { RedisModule } from '@src/core/redis';
import { FeaturePricingModule } from '@src/modules/feature-pricing/feature-pricing.module';
import { HotelConfigurationSharedModule } from '@src/modules/hotel-configuration/hotel-configuration-shared.module';
import { HotelRepositoryModule } from '@src/modules/hotel/modules/hotel-repository.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductPricingMethodDetail } from 'src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { QUEUE_NAMES } from 'src/core/queue/queue.constant';
import { PmsModule } from 'src/modules/pms/pms.module';
import { RoomProductRatePlanRepositoryModule } from '../room-product-rate-plan-repository.module';
import { RoomProductSellingPriceModule } from '../room-product-selling-price/room-product-selling-price.module';
import { AttributeLogicService } from './attribute-logic.service';
import { DerivedProductService } from './derived-product.service';
import { HandlePositioningService } from './handle-positioning.service';
import { LinkProductService } from './link-product.service';
import { ReversedProductService } from './reversed-product.service';
import { RoomProductPricingMethodDetailController } from './room-product-pricing-method-detail.controller';
import { RoomProductPricingMethodDetailService } from './room-product-pricing-method-detail.service';
import { HotelConfigurationsModule } from '@src/modules/hotel-configurations/hotel-configurations.module';

@Module({
  controllers: [RoomProductPricingMethodDetailController],
  providers: [
    RoomProductPricingMethodDetailService,
    HandlePositioningService,
    LinkProductService,
    DerivedProductService,
    AttributeLogicService,

    ReversedProductService
  ],
  imports: [
    HotelConfigurationSharedModule,
    RoomProductRatePlanRepositoryModule,
    HotelRepositoryModule,

    RedisModule,
    TypeOrmModule.forFeature(
      [
        RoomProductPricingMethodDetail,
        RoomProduct,
        RoomProductAssignedUnit,
        RoomProductDailyAvailability,
        RoomProductDailySellingPrice,
        RoomProductRetailFeature,
        Connector,
        RatePlanDerivedSetting,
        RoomProductMapping,
        RatePlan,
        Hotel
      ],
      DbName.Postgres
    ),
    RoomProductSellingPriceModule,
    PmsModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ROOM_PRODUCT_PRICING
    }),
    RatePlanAdjustmentModule,
    forwardRef(() => FeaturePricingModule),
    RoomProductPricingModule
  ],
  exports: [RoomProductPricingMethodDetailService]
})
export class RoomProductPricingMethodDetailModule {}
