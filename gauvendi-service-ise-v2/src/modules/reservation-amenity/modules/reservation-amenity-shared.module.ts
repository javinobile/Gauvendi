import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationAmenity } from 'src/core/entities/booking-entities/reservation-amenity.entity';
import { ReservationAmenityRepository } from '../repositories/reservation-amenity.repository';
import { S3Module } from 'src/core/s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservationAmenity], DB_NAME.POSTGRES),
    ConfigModule,
    S3Module
  ],
  providers: [ReservationAmenityRepository],
  exports: [ReservationAmenityRepository]
})
export class ReservationAmenitySharedModule {}
