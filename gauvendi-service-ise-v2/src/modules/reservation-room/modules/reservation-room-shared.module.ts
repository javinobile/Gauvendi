import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationRoom } from 'src/core/entities/booking-entities/reservation-room.entity';
import { ReservationRoomRepository } from '../repositories/reservation-room.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationRoom], DB_NAME.POSTGRES), ConfigModule],
  providers: [ReservationRoomRepository],
  exports: [ReservationRoomRepository]
})
export class ReservationRoomSharedModule {}
