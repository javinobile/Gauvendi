import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailCategory } from 'src/core/entities/hotel-retail-category.entity';
import { HotelRetailCategoryRepository } from './repositories/hotel-retail-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelRetailCategory, Hotel], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelRetailCategoryRepository],
  exports: [HotelRetailCategoryRepository]
})
export class HotelRetailCategorySharedModule {}
