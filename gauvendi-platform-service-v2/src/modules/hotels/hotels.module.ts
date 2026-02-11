import { HotelConfiguration } from '@entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { DbName } from '@constants/db-name.constant';
import { S3Module } from '@src/core/s3/s3.module';
import { FileLibrary } from '@src/core/entities/core-entities/file-library.entity';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { HotelPaymentAccount } from '@src/core/entities/hotel-entities/hotel-payment-account.entity';

@Module({
  controllers: [HotelsController],
  providers: [HotelsService],
  imports: [
    TypeOrmModule.forFeature(
      [Hotel, HotelConfiguration, FileLibrary, MappingPmsHotel, HotelPaymentAccount],
      DbName.Postgres
    ),
    ConfigModule,
    S3Module
  ],
  exports: [HotelsService]
})
export class HotelsModule {}
