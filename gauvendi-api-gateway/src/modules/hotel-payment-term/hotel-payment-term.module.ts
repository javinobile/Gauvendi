import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { HotelPaymentTermController } from "./hotel-payment-term.controller";
import { HotelPaymentTermService } from "./hotel-payment-term.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [HotelPaymentTermController],
  providers: [HotelPaymentTermService],
})
export class HotelPaymentTermModule {}
