import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';
import { HotelStandardFeature } from 'src/core/entities/hotel-standard-feature.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { HotelRetailFeaturesController } from './hotel-retail-features.controller';
import { HotelRetailFeaturesService } from './hotel-retail-features.service';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { HotelConfiguration } from 'src/core/entities/hotel-entities/hotel-configuration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HotelRetailFeature, Hotel, HotelStandardFeature, RoomProductRetailFeature, HotelConfiguration], DB_NAME.POSTGRES),
    S3Module,
    HttpModule
  ],
  controllers: [HotelRetailFeaturesController],
  providers: [HotelRetailFeaturesService],
  exports: [HotelRetailFeaturesService]
})
export class HotelRetailFeaturesModule {}
