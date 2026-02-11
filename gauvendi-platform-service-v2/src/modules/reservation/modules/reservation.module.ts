import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { ApaleoRatePlanPmsMapping } from '@src/core/entities/apaleo-entities/apaleo-rate-plan-pms-mapping.entity';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { Guest } from '@src/core/entities/booking-entities/guest.entity';
import { ReservationRoom } from '@src/core/entities/booking-entities/reservation-room.entity';
import { ReservationTimeSlice } from '@src/core/entities/booking-entities/reservation-time-slice.entity';
import { Connector } from '@src/core/entities/hotel-entities/connector.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import { QUEUE_NAMES, QUEUE_NAMES_ENV, REDIS_DB } from '@src/core/queue/queue.constant';
import { RedisModule } from '@src/core/redis';
import { BookingTransactionSharedModule } from '@src/modules/booking-transaction/modules/booking-transaction-shared.module';
import { BookingSharedModule } from '@src/modules/booking/modules/booking-shared.module';
import { CountriesModule } from '@src/modules/countries/countries.module';
import { EmailHistorySharedModule } from '@src/modules/email-history/modules/email-history-shared.module';
import { GlobalPaymentMethodSharedModule } from '@src/modules/global-payment-method/modules/global-payment-method-shared.module';
import { GuestSharedModule } from '@src/modules/guest/modules/guest-shared.module';
import { HotelAmenitySharedModule } from '@src/modules/hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelPaymentTermSharedModule } from '@src/modules/hotel-payment-term/modules/hotel-payment-term-shared.module';
import { NotificationModule } from '@src/modules/notification';
import { PmsModule } from '@src/modules/pms/pms.module';
import { RatePlanSettingsModule } from '@src/modules/rate-plan-settings/modules/rate-plan-settings.module';
import { ReservationAmenityDateSharedModule } from '@src/modules/reservation-amenity-date/modules/reservation-amenity-date-shared.module';
import { ReservationAmenitySharedModule } from '@src/modules/reservation-amenity/modules/reservation-amenity-shared.module';
import { ReservationRoomSharedModule } from '@src/modules/reservation-room/modules/reservation-room-shared.module';
import { ReservationTimeSliceSharedModule } from '@src/modules/reservation-time-slice/modules/reservation-time-slice-shared.module';
import { RoomProductAvailabilityModule } from '@src/modules/room-product-availability/room-product-availability.module';
import { RoomProductHotelExtraListModule } from '@src/modules/room-product-hotel-extra-list/room-product-hotel-extra-list.module';
import { RoomProductMappingPmsSharedModule } from '@src/modules/room-product-mapping-pms/modules/room-product-mapping-pms-shared.module';
import { RoomProductMappingSharedModule } from '@src/modules/room-product-mapping/modules/room-product-mapping-shared.module';
import { RoomUnitModule } from '@src/modules/room-unit/room-unit.module';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationConsumer } from '../queue/reservation-consumer';
import { ReservationQueueEvents } from '../queue/reservation-queue-events';
import { ReservationService } from '../services/reservation.service';
import { ReservationSharedModule } from './reservation-shared.module';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { HotelCityTax } from '@src/core/entities/hotel-entities/hotel-city-tax.entity';
import { BookingTransaction } from '@src/core/entities/booking-entities/booking-transaction.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { HotelConfigurationSharedModule } from '@src/modules/hotel-configuration/hotel-configuration-shared.module';

@Module({
  imports: [
    ReservationSharedModule,
    BookingTransactionSharedModule,
    GlobalPaymentMethodSharedModule,
    RoomUnitModule,
    HotelPaymentTermSharedModule,
    RoomProductMappingSharedModule,
    ReservationAmenitySharedModule,
    HotelAmenitySharedModule,
    RoomProductHotelExtraListModule,
    EmailHistorySharedModule,
    PmsModule,
    BookingSharedModule,
    ConfigModule,
    RoomProductMappingPmsSharedModule,
    HotelAmenitySharedModule,
    ReservationTimeSliceSharedModule,
    ReservationAmenityDateSharedModule,
    ReservationRoomSharedModule,
    GuestSharedModule,
    CountriesModule,
    NotificationModule,
    RoomProductAvailabilityModule,
    RatePlanSettingsModule,
    HotelConfigurationSharedModule,
    RedisModule,
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES_ENV.RESERVATION,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            url: configService.get(ENVIRONMENT.REDIS_URL),
            maxRetriesPerRequest: null,
            db: REDIS_DB.RESERVATION
          },
          prefix: configService.get(ENVIRONMENT.BULL_RESERVATION_QUEUE),
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 10,
            concurrency: 10,
            backoff: {
              type: 'exponential',
              delay: 1000
            }
          }
        };
      }
    }),
    TypeOrmModule.forFeature(
      [
        ApaleoRatePlanPmsMapping,
        HotelRetailFeature,
        RatePlan,
        BookingProposalSetting,
        Hotel,
        Connector,
        ReservationRoom,
        Guest,
        RoomProductExtra,
        RatePlanExtraService,
        ReservationTimeSlice,
        Booking,
        HotelCityTax,
        BookingTransaction,
        Reservation
      ],
      DbName.Postgres
    )
  ],
  controllers: [ReservationController],
  // ReservationQueueEvents
  providers: [ReservationService, ReservationConsumer],
  exports: [ReservationService, TypeOrmModule]
})
export class ReservationModule {}
