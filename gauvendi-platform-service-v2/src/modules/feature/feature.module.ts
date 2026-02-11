import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { AdminModule } from 'src/core/admin-service/admin.module';
import { HotelRetailCategoryTranslation } from 'src/core/entities/hotel-retail-category-translation.entity';
import { HotelRetailCategory } from 'src/core/entities/hotel-retail-category.entity';
import { HotelRetailFeatureTranslation } from 'src/core/entities/hotel-retail-feature-translation.entity';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';
import { HotelStandardFeatureTranslation } from 'src/core/entities/hotel-standard-feature-translation.entity';
import { HotelStandardFeature } from 'src/core/entities/hotel-standard-feature.entity';
import { RoomProductStandardFeature } from 'src/core/entities/room-product-standard-feature.entity';
import { QUEUE_NAMES } from 'src/core/queue/queue.constant';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';
import { ConfigModule } from '@nestjs/config';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { RoomUnitRetailFeature } from '@src/core/entities/room-unit-retail-feature.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { RoomProductModule } from '../room-product/room-product.module';

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
  imports: [
    TypeOrmModule.forFeature(
      [
        HotelStandardFeature,
        HotelStandardFeatureTranslation,
        HotelRetailFeature,
        HotelRetailFeatureTranslation,
        HotelRetailCategory,
        HotelRetailCategoryTranslation,
        RoomProductStandardFeature,
        RoomUnit,
        RoomUnitRetailFeature,
        RoomProductRetailFeature,
        HotelConfiguration
      ],
      DbName.Postgres
    ),
    BullModule.registerQueue({
      name: QUEUE_NAMES.ROOM_PRODUCT_PRICING
    }),
    AdminModule,
    ConfigModule,
    RoomProductModule
  ]
})
export class FeatureModule {}
