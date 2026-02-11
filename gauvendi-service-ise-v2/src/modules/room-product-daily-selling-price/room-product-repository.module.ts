import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductDailySellingPriceRepository } from './room-product-daily-selling-price.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomProductDailySellingPrice], DB_NAME.POSTGRES),
    ConfigModule
  ],
  providers: [RoomProductDailySellingPriceRepository],
  exports: [RoomProductDailySellingPriceRepository]
})
export class RoomProductDailySellingPriceRepositoryModule {}
