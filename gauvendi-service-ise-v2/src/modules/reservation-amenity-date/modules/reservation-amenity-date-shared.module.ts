import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationAmenityDate } from 'src/core/entities/booking-entities/reservation-amenity-date.entity';
import { ReservationAmenityDateRepository } from '../repositories/reservation-amenity-date.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationAmenityDate], DB_NAME.POSTGRES), ConfigModule],
  providers: [ReservationAmenityDateRepository],
  exports: [ReservationAmenityDateRepository]
})
export class ReservationAmenityDateSharedModule {}
