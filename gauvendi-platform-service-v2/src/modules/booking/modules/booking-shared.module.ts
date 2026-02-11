import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingMetaTrackingRepository } from '../repositories/booking-meta-tracking.repository';
import { BookingMetaTracking } from '@src/core/entities/booking-entities/booking-meta-tracking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Booking, BookingProposalSetting, BookingMetaTracking],
      DbName.Postgres
    )
  ],
  providers: [BookingRepository, BookingMetaTrackingRepository],
  exports: [BookingRepository, BookingMetaTrackingRepository]
})
export class BookingSharedModule {}
