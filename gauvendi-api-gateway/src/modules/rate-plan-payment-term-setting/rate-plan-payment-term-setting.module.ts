import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { RatePlanPaymentTermSettingController } from "./rate-plan-payment-term-setting.controller";
import { RatePlanPaymentTermSettingService } from "./rate-plan-payment-term-setting.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [RatePlanPaymentTermSettingController],
  providers: [RatePlanPaymentTermSettingService],
})
export class RatePlanPaymentTermSettingModule {}
