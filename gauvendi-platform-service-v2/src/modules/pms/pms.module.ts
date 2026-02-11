import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApaleoRatePlanPmsMapping } from '@src/core/entities/apaleo-entities/apaleo-rate-plan-pms-mapping.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelTax } from '@src/core/entities/hotel-entities/hotel-tax.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { RedisModule } from '@src/core/redis/redis.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { HotelRestrictionSetting } from 'src/core/entities/hotel-restriction-setting.entity';
import { MewsServiceSettings } from 'src/core/entities/mews-entities/mews-service-settings.entity';
import { Restriction } from 'src/core/entities/restriction.entity';
import { RoomProductMappingPms } from 'src/core/entities/room-product-mapping-pms.entity';
import { BookingTransactionSharedModule } from '../booking-transaction/modules/booking-transaction-shared.module';
import { BookingSharedModule } from '../booking/modules/booking-shared.module';
import { CountryRepositoryModule } from '../country/contry-repository.module';
import { HotelAmenitySharedModule } from '../hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { ReservationAmenityDateSharedModule } from '../reservation-amenity-date/modules/reservation-amenity-date-shared.module';
import { ReservationAmenitySharedModule } from '../reservation-amenity/modules/reservation-amenity-shared.module';
import { ReservationSharedModule } from '../reservation/modules/reservation-shared.module';
import { RoomProductSharedModule } from '../room-product/room-product-shared.module';
import { ApaleoPmsService } from './apaleo/apaleo-pms.service';
import { ApaleoService } from './apaleo/apaleo.service';
import { MewsPmsService } from './mews/mews-pms.service';
import { MewsService } from './mews/mews.service';
import { PmsController } from './pms.controller';
import { PmsService } from './pms.service';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { Maintenance } from '@src/core/entities/availability-entities/maintenance.entity';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { Company } from '@src/core/entities/booking-entities/company.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';

@Module({
  controllers: [PmsController],
  providers: [PmsService, ApaleoService, MewsService, ApaleoPmsService, MewsPmsService],
  imports: [
    HttpModule,
    ConfigModule,
    ReservationAmenitySharedModule,
    ReservationAmenityDateSharedModule,
    BookingTransactionSharedModule,
    HotelAmenitySharedModule,
    RoomProductSharedModule,
    CountryRepositoryModule,
    ReservationSharedModule,
    forwardRef(() => HotelRepositoryModule),
    BookingSharedModule,
    RedisModule,
    TypeOrmModule.forFeature(
      [
        HotelRestrictionSetting,
        Restriction,
        RoomProductMappingPms,
        Connector,
        MewsServiceSettings,
        Hotel,
        RatePlan,
        ApaleoRatePlanPmsMapping,
        RoomUnit,
        HotelTax,
        HotelConfiguration,
        RoomUnitAvailability,
        Maintenance,
        MappingPmsHotel,
        Company,
        Reservation,
        Booking,
        HotelAmenity
      ],
      DbName.Postgres
    ) // for postgres
  ],
  exports: [PmsService, ApaleoService]
})
export class PmsModule {}
