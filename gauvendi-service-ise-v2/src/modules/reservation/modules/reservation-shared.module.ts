import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Reservation } from 'src/core/entities/booking-entities/reservation.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { HotelConfigurationSharedModule } from 'src/modules/hotel-configuration/hotel-configuration-shared.module';
import { ReservationRepository } from '../repositories/reservation.repository';
import { PlatformClientModule } from 'src/core/clients/platform-client.module';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';

@Module({
  imports: [
    HotelConfigurationSharedModule,
    TypeOrmModule.forFeature(
      [Reservation, RoomProduct, HotelTax, HotelRetailFeature, RoomProductRetailFeature],
      DB_NAME.POSTGRES
    ),
    ConfigModule,
    PlatformClientModule
  ],
  providers: [ReservationRepository],
  exports: [ReservationRepository]
})
export class ReservationSharedModule {}
