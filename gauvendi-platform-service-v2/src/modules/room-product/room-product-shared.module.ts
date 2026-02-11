import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductBasePriceSetting } from '@src/core/entities/room-product-base-price-setting.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomProductExtraOccupancyRate } from '@src/core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProductFeatureRateAdjustment } from '@src/core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductImage } from '@src/core/entities/room-product-image.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { RoomProductRepository } from './room-product.repository';

@Module({
  imports: [
    HotelRepositoryModule,
    TypeOrmModule.forFeature(
      [
        RoomProduct,
        RoomProductDailyAvailability,
        RoomProductAssignedUnit,
        RoomProductImage,
        RoomProductStandardFeature,
        RoomProductRetailFeature,
        RoomProductMappingPms,
        RoomProductMapping,
        RoomUnit,
        RoomProductFeatureRateAdjustment,
        RoomProductExtraOccupancyRate,
        RoomProductBasePriceSetting,
        HotelRetailFeature
      ],
      DbName.Postgres
    )
  ],
  providers: [RoomProductRepository],
  exports: [RoomProductRepository]
})
export class RoomProductSharedModule {}
