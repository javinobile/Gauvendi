import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { ApaleoRatePlanPmsMapping } from 'src/core/entities/apaleo-entities/apaleo-rate-plan-pms-mapping.entity';
import { MewsServiceSettings } from 'src/core/entities/mews-entities/mews-service-settings.entity';
import { RedisModule } from 'src/core/modules/redis/redis.module';
import { AvailabilityModule } from 'src/modules/availability/availability.module';
import { BookingTransactionSharedModule } from 'src/modules/booking-transaction/modules/booking-transaction-shared.module';
import { BookingSharedModule } from 'src/modules/booking/modules/booking-shared.module';
import { CoreModule } from 'src/modules/core/core.module';
import { HotelAmenitySharedModule } from 'src/modules/hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelTaxRepositoryModule } from 'src/modules/hotel-tax/hotel-tax-repository.module';
import { RatePlanSharedModule } from 'src/modules/rate-plan/modules/rate-plan-shared.module';
import { ReservationAmenityDateSharedModule } from 'src/modules/reservation-amenity-date/modules/reservation-amenity-date-shared.module';
import { ReservationAmenitySharedModule } from 'src/modules/reservation-amenity/modules/reservation-amenity-shared.module';
import { ReservationSharedModule } from 'src/modules/reservation/modules/reservation-shared.module';
import { ApaleoPmsService } from './services/apaleo-pms.service';
import { MewsPmsService } from './services/mews-pms.service';
import { PmsService } from './services/pms.service';
import { RoomUnit } from 'src/core/entities/room-unit.entity';
import { Company } from 'src/core/entities/booking-entities/company.entity';
import { MappingPmsHotel } from 'src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    BookingSharedModule,
    RedisModule,
    ReservationAmenityDateSharedModule,
    ReservationAmenitySharedModule,
    ReservationSharedModule,
    BookingTransactionSharedModule,
    RatePlanSharedModule,
    HotelTaxRepositoryModule,
    HotelAmenitySharedModule,
    AvailabilityModule,
    CoreModule,

    TypeOrmModule.forFeature(
      [ApaleoRatePlanPmsMapping, MewsServiceSettings, RoomUnit, Company, MappingPmsHotel, Hotel],
      DB_NAME.POSTGRES
    )
  ],
  controllers: [],
  providers: [MewsPmsService, PmsService, ApaleoPmsService],
  exports: [PmsService]
})
export class PmsModule {}
