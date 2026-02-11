import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { ReservationController } from "./reservation.controller";
import { ReservationService } from "./reservation.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [ReservationController],
  providers: [ReservationService],
})
export class ReservationModule {}
