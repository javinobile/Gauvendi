import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailCategory } from 'src/core/entities/hotel-retail-category.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { HotelRetailCategorySharedModule } from './hotel-retail-category-shared.module';
import { HotelRetailCategoryController } from './hotel-retail-category.controller';
import { HotelRetailCategoryService } from './services/hotel-retail-category.service';


@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([HotelRetailCategory, Hotel], DB_NAME.POSTGRES),
    HotelRetailCategorySharedModule,
    S3Module
  ],
  controllers: [HotelRetailCategoryController],
  providers: [HotelRetailCategoryService]
})
export class HotelRetailCategoryModule {}
