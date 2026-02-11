import { Module } from '@nestjs/common';
import { RoomProductLowestRateCalendarController } from '../controllers/room-product-lowest-rate-calendar.controller';
import { RoomProductLowestRateCalendarService } from '../services/room-product-lowest-rate-calendar.service';

@Module({
  controllers: [RoomProductLowestRateCalendarController],
  providers: [RoomProductLowestRateCalendarService],
  exports: [RoomProductLowestRateCalendarService],
})
export class RoomProductLowestRateCalendarModule {}
