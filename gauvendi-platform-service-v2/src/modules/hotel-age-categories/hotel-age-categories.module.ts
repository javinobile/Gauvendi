import { HotelAgeCategory } from '@entities/hotel-entities/hotel-age-category.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelAgeCategoriesController } from './hotel-age-categories.controller';
import { HotelAgeCategoriesService } from './hotel-age-categories.service';
import { DbName } from "@constants/db-name.constant";
import { Hotel } from '@entities/hotel-entities/hotel.entity';

@Module({
  controllers: [HotelAgeCategoriesController],
  providers: [HotelAgeCategoriesService],
  imports: [TypeOrmModule.forFeature([HotelAgeCategory, Hotel], DbName.Postgres)],
})
export class HotelAgeCategoriesModule {}
