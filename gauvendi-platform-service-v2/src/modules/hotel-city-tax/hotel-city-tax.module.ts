import { HotelCityTax } from '@entities/hotel-entities/hotel-city-tax.entity';
import { HotelCityTaxAgeGroup } from '@entities/hotel-entities/hotel-city-tax-age-group.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelCityTaxController } from './hotel-city-tax.controller';
import { HotelCityTaxService } from './hotel-city-tax.service';
import { DbName } from '@constants/db-name.constant';
import { PmsModule } from '../pms/pms.module';

@Module({
  controllers: [HotelCityTaxController],
  providers: [HotelCityTaxService],
  imports: [
    TypeOrmModule.forFeature([HotelCityTax, HotelCityTaxAgeGroup, Hotel], DbName.Postgres),
    PmsModule
  ]
})
export class HotelCityTaxModule {}
