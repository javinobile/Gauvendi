import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { GuestController } from "./guest.controller";
import { GuestService } from "./guest.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [GuestController],
  providers: [GuestService],
})
export class GuestModule {}
