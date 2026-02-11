import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelAmenityRepository } from '../repositories/hotel-amenity.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelAmenity, HotelAmenityPrice], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelAmenityRepository],
  exports: [HotelAmenityRepository]
})
export class HotelAmenitySharedModule {}
