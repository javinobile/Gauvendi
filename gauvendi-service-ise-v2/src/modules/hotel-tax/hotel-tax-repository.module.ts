import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { HotelTaxRepository } from './hotel-tax.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelTax], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelTaxRepository],
  exports: [HotelTaxRepository]
})
export class HotelTaxRepositoryModule {}
