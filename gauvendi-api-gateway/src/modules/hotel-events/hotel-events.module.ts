import { Module } from '@nestjs/common';
import { HotelEventsService } from './hotel-events.service';
import { HotelEventsController } from './hotel-events.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [HotelEventsController],
  providers: [HotelEventsService],
  imports: [PlatformClientModule],
})
export class HotelEventsModule {}
