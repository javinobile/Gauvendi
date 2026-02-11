import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationTimeSlice } from 'src/core/entities/booking-entities/reservation-time-slice.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { HotelConfigurationSharedModule } from 'src/modules/hotel-configuration/hotel-configuration-shared.module';
import { ReservationTimeSliceRepository } from '../repositories/reservation-time-slice.repository';

@Module({
  imports: [
    HotelConfigurationSharedModule,
    TypeOrmModule.forFeature([ReservationTimeSlice, RoomProduct], DB_NAME.POSTGRES), ConfigModule],
  providers: [ReservationTimeSliceRepository],
  exports: [ReservationTimeSliceRepository]
})
export class ReservationTimeSliceSharedModule {}
