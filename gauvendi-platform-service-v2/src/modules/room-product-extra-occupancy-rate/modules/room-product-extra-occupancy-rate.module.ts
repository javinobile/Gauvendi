import { Module } from '@nestjs/common';
import { RoomProductExtraOccupancyRateRepositoryModule } from './room-product-extra-occupancy-rate-repository.module';
import { RoomProductExtraOccupancyRateController } from '../controllers/room-product-extra-occupancy-rate.controller';
import { RoomProductExtraOccupancyRateRepository } from '../repositories/room-product-extra-occupancy-rate.repository';

@Module({
  imports: [RoomProductExtraOccupancyRateRepositoryModule],
  controllers: [RoomProductExtraOccupancyRateController],
  providers: [],
  exports: []
})
export class RoomProductExtraOccupancyRateModule {}
