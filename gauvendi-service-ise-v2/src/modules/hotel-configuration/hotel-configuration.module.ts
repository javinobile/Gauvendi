import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelConfiguration } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { S3Module } from 'src/core/s3/s3.module';
import {
  HotelConfigurationSharedModule
} from './hotel-configuration-shared.module';
import { HotelConfigurationController } from './hotel-configuration.controller';
import { HotelConfigurationService } from './services/hotel-configuration.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([HotelConfiguration, Hotel], DB_NAME.POSTGRES),
    HotelConfigurationSharedModule,
    S3Module
  ],
  controllers: [HotelConfigurationController],
  providers: [HotelConfigurationService]
})
export class HotelConfigurationModule {}
