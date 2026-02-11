import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelAmenityRepository } from '../repositories/hotel-amenity.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelAmenity], DbName.Postgres)],
  providers: [HotelAmenityRepository],
  exports: [HotelAmenityRepository]
})
export class HotelAmenitySharedModule {}
