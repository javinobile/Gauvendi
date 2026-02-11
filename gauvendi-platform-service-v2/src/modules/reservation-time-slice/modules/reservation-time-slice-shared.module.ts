import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationTimeSlice } from 'src/core/entities/booking-entities/reservation-time-slice.entity';
import { ReservationTimeSliceRepository } from '../repositories/reservation-time-slice.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationTimeSlice, RoomProduct], DB_NAME.POSTGRES), ConfigModule],
  providers: [ReservationTimeSliceRepository],
  exports: [ReservationTimeSliceRepository]
})
export class ReservationTimeSliceSharedModule {}
