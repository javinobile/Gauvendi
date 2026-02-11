import { Module } from '@nestjs/common';
import { HotelMarketSegmentsController } from './hotel-market-segments.controller';
import { HotelMarketSegmentSharedModule } from './modules/hotel-market-segment-shared.module';
import { HotelMarketSegmentService } from './services/hotel-market-segment.service';

@Module({
  imports: [HotelMarketSegmentSharedModule],
  controllers: [HotelMarketSegmentsController],
  providers: [HotelMarketSegmentService]
})
export class HotelMarketSegmentsModule {}
