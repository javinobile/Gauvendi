import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';
import { HotelRetailFeaturesController } from './hotel-retail-features.controller';
import { HotelRetailFeaturesService } from './hotel-retail-features.service';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { HotelRetailFeatureTranslation } from '@src/core/entities/hotel-retail-feature-translation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [HotelRetailFeature, Hotel, HotelRetailFeatureTranslation],
      DB_NAME.POSTGRES
    ),
    S3Module
  ],
  controllers: [HotelRetailFeaturesController],
  providers: [HotelRetailFeaturesService],
  exports: [HotelRetailFeaturesService]
})
export class HotelRetailFeaturesModule {}
