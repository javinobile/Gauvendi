import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomUnitRetailFeature } from 'src/core/entities/room-unit-retail-feature.entity';
import { RoomUnit } from 'src/core/entities/room-unit.entity';
import { PmsModule } from '../pms/pms.module';
import { ReservationSharedModule } from '../reservation/modules/reservation-shared.module';
import { RoomProductAvailabilityModule } from '../room-product-availability/room-product-availability.module';
import { RoomProductSharedModule } from '../room-product/room-product-shared.module';
import { RoomUnitV2Service } from './room-unit-v2.service';
import { RoomUnitController } from './room-unit.controller';
import { RoomUnitRepository } from './room-unit.repository';
import { RoomUnitService } from './room-unit.service';
import { RoomProductModule } from '../room-product/room-product.module';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { Maintenance } from '@src/core/entities/availability-entities/maintenance.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';

@Module({
  controllers: [RoomUnitController],
  providers: [RoomUnitService, RoomUnitV2Service, RoomUnitRepository],
  imports: [
    TypeOrmModule.forFeature(
      [
        RoomUnit,
        RoomUnitAvailability,
        RoomProductAssignedUnit,
        RoomProductRetailFeature,
        RoomUnitRetailFeature,
        RoomProduct,
        HotelRetailFeature,
        BookingProposalSetting,
        Hotel,
        RoomProductMappingPms,
        HotelConfiguration,
        Maintenance
      ],
      DbName.Postgres
    ),
    ReservationSharedModule,
    PmsModule,

    RoomProductAvailabilityModule,
    RoomProductSharedModule,
    RoomProductModule
  ],
  exports: [RoomUnitService]
})
export class RoomUnitModule {}
