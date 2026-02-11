import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { HotelRepository } from '../repositories/hotel.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hotel, HotelTaxSetting, HotelAmenity], DB_NAME.POSTGRES),
    ConfigModule
  ],
  providers: [HotelRepository],
  exports: [HotelRepository]
})
export class HotelSharedModule {}
