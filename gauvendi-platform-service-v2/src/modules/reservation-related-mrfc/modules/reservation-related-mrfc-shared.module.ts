import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationRelatedMrfc } from 'src/core/entities/booking-entities/reservation-related-mrfc.entity';
import { ReservationRelatedMrfcRepository } from '../repositories/reservation-related-mrfc.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationRelatedMrfc], DB_NAME.POSTGRES), ConfigModule],
  providers: [ReservationRelatedMrfcRepository],
  exports: [ReservationRelatedMrfcRepository]
})
export class ReservationRelatedMrfcSharedModule {}
