import { Module } from '@nestjs/common';
import { RoomProductAvailabilityService } from './room-product-availability.service';
import { RoomProductAvailabilityController } from './room-product-availability.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [RoomProductAvailabilityController],
  providers: [RoomProductAvailabilityService],
  imports: [PlatformClientModule],
})
export class RoomProductAvailabilityModule {}
