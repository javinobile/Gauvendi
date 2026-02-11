import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelCityTaxAgeGroup } from 'src/core/entities/hotel-entities/hotel-city-tax-age-group.entity';
import { HotelCityTax } from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelCityTaxRepository } from './hotel-city-tax.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelCityTax, HotelCityTaxAgeGroup], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelCityTaxRepository],
  exports: [HotelCityTaxRepository]
})
export class HotelCityTaxRepositoryModule {}
