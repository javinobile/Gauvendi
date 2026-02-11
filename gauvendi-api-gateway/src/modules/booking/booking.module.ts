import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";

@Module({
  controllers: [BookingController],
  providers: [BookingService],
  imports: [PlatformClientModule],
})
export class BookingModule {}
