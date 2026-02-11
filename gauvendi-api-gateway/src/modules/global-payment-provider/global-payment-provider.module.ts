import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { GlobalPaymentProviderController } from "./global-payment-provider.controller";
import { GlobalPaymentProviderService } from "./global-payment-provider.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [GlobalPaymentProviderController],
  providers: [GlobalPaymentProviderService],
})
export class GlobalPaymentProviderModule {}
