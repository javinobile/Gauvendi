import { Module } from "@nestjs/common";
import { PricingController } from "./pricing.controller";
import { PricingService } from "./pricing.service";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";

@Module({
  imports: [PlatformClientModule],
  controllers: [PricingController],
  providers: [PricingService],
})
export class PricingModule {}
