import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { ExtraBedCalculateService } from '@src/core/modules/pricing-calculate/services/extra-bed.service';
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
import { S3Module } from 'src/core/s3/s3.module';
import { HotelAmenityModule } from '../hotel-amenity/hotel-amentity.module';
import { CalculateAmenityPricingService } from './calculate-amenity-pricing.service';
import { RoomProductHotelExtraListController } from './room-product-hotel-extra-list.controller';
import { RoomProductHotelExtraListService } from './room-product-hotel-extra-list.service';

@Module({
  imports: [
    HotelAmenityModule,
    S3Module,

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
        HotelTax,
        RatePlanDerivedSetting
      ],
      DB_NAME.POSTGRES
    )
  ],
  controllers: [RoomProductHotelExtraListController],
  providers: [RoomProductHotelExtraListService, CalculateAmenityPricingService, ExtraBedCalculateService],
  exports: [RoomProductHotelExtraListService]
})
export class RoomProductHotelExtraListModule {}
