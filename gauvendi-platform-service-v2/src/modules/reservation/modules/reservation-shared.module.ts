import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { HotelTax } from '@src/core/entities/hotel-entities/hotel-tax.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { TranslationI18nLocale } from '@src/core/entities/translation-entities/translation-i18n-locale.entity';
import { GuestSharedModule } from '@src/modules/guest/modules/guest-shared.module';
import { ReservationRepository } from '../repositories/reservation.repository';
import { ReservationNotesService } from '../services/reservation-notes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        Reservation,
        HotelTax,
        RoomProduct,
        TranslationI18nLocale,
        BookingProposalSetting,
        HotelRetailFeature,
        RoomUnit,
        RatePlan
      ],
      DbName.Postgres
    ),
    GuestSharedModule,
    ConfigModule
  ],
  providers: [ReservationRepository, ReservationNotesService],
  exports: [ReservationRepository, ReservationNotesService]
})
export class ReservationSharedModule {}
