import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductExtraOccupancyRate } from 'src/core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { HotelSharedModule } from 'src/modules/hotel-v2/modules/hotel-shared.module';
import { RoomProductRepository } from '../repositories/room-product.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomProduct, RoomProductExtraOccupancyRate], DB_NAME.POSTGRES),
    HotelSharedModule,
    ConfigModule
  ],
  providers: [RoomProductRepository],
  exports: [RoomProductRepository]
})
export class RoomProductSharedModule {}
