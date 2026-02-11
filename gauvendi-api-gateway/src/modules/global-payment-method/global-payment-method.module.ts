import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { GlobalPaymentMethodController } from "./global-payment-method.controller";
import { GlobalPaymentMethodService } from "./global-payment-method.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [GlobalPaymentMethodController],
  providers: [GlobalPaymentMethodService],
})
export class GlobalPaymentMethodModule {}
