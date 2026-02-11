import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RatePlanExtraService } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanDailyExtraService } from 'src/core/entities/rate-plan-daily-extra-service.entity';
import { RoomProductExtra } from 'src/core/entities/room-product-extra.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { AmenityCalculateModule } from 'src/core/modules/amenity-calculate/amenity-calculate.module';
import { S3Module } from 'src/core/s3/s3.module';
import { CalculateAllocationService } from 'src/core/services/calculate-allocation.service';
import { CalculateAmenityPricingService } from 'src/core/services/calculate-amenity-pricing.service';
import { HotelAmenitySharedModule } from '../hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelAmenityModule } from '../hotel-amenity/modules/hotel-amenity.module';
import { RoomProductHotelExtraListController } from './room-product-hotel-extra-list.controller';
import { RoomProductHotelExtraListService } from './room-product-hotel-extra-list.service';

@Module({
  imports: [
    HotelAmenityModule,
    S3Module,
    AmenityCalculateModule,
    HotelAmenitySharedModule,
    TypeOrmModule.forFeature(
      [
        HotelAmenity,
        RoomProductExtra,
        RatePlanExtraService,
        RatePlanDailyExtraService,
        RoomProduct,
        RatePlan,
        Hotel,
        HotelTaxSetting,
        HotelTax
      ],
      DB_NAME.POSTGRES
    )
  ],
  controllers: [RoomProductHotelExtraListController],
  providers: [
    RoomProductHotelExtraListService,
    CalculateAllocationService,
    CalculateAmenityPricingService
  ]
})
export class RoomProductHotelExtraListModule {}
