import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { FeaturePricingController } from "./feature-pricing.controller";
import { FeaturePricingService } from "./feature-pricing.service";


@Module({
  controllers: [FeaturePricingController],
  providers: [FeaturePricingService],
  imports: [PlatformClientModule],
})
export class FeaturePricingModule {}