import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { HotelTemplateEmailController } from "./hotel-template-email.controller";
import { HotelTemplateEmailService } from "./hotel-template-email.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [HotelTemplateEmailController],
  providers: [HotelTemplateEmailService],
})
export class HotelTemplateEmailModule {}
