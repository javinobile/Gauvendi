import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { HotelMarketSegmentController } from "./hotel-market-segment.controller";
import { HotelMarketSegmentService } from "./hotel-market-segment.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [HotelMarketSegmentController],
  providers: [HotelMarketSegmentService],
})
export class HotelMarketSegmentModule {}
