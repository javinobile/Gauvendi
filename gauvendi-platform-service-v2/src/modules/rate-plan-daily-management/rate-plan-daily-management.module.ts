import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlanDailyManagementService } from './rate-plan-daily-management.service';
import { RatePlanDailyManagementController } from './rate-plan-daily-management.controller';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { ReservationRoom } from '@src/core/entities/booking-entities/reservation-room.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { DbName } from '@src/core/constants/db-name.constant';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { BlockDaily } from '@src/core/entities/availability-entities/block-daily.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        RoomProduct,
        RoomUnit,
        RoomUnitAvailability,
        Reservation,
        ReservationRoom,
        RoomProductMapping,
        RoomProductAssignedUnit,
        RoomProductDailyAvailability,
        Hotel,
        BlockDaily
      ],
      DbName.Postgres
    )
  ],
  controllers: [RatePlanDailyManagementController],
  providers: [RatePlanDailyManagementService],
  exports: [RatePlanDailyManagementService]
})
export class RatePlanDailyManagementModule {}
