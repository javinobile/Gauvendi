import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { BookingMetaTracking } from 'src/core/entities/booking-entities/booking-meta-tracking.entity';
import { BookingProposalSetting } from 'src/core/entities/booking-entities/booking-proposal-setting.entity';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { BookingMetaTrackingRepository } from '../repositories/booking-meta-tracking.repository';
import { BookingRepository } from '../repositories/booking.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingProposalSetting, BookingMetaTracking], DB_NAME.POSTGRES)],
  providers: [BookingRepository, BookingMetaTrackingRepository],
  exports: [TypeOrmModule, BookingRepository, BookingMetaTrackingRepository]
})
export class BookingSharedModule {}
