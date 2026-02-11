import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { BlockDaily } from '@src/core/entities/availability-entities/block-daily.entity';
import { GroupBooking } from '@src/core/entities/availability-entities/group-booking.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { BlockSharedService } from '../services/block-shared.service';
import { RoomProductAvailabilityModule } from '@src/modules/room-product-availability/room-product-availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockDaily, GroupBooking, RoomProductMappingPms], DbName.Postgres),
    forwardRef(() => RoomProductAvailabilityModule)
  ],
  providers: [BlockSharedService],
  exports: [TypeOrmModule, BlockSharedService]
})
export class BlockSharedModule {}
