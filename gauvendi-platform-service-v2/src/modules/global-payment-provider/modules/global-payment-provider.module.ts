import { Module } from '@nestjs/common';
import { GlobalPaymentProviderController } from '../controllers/global-payment-provider.controller';
import { GlobalPaymentProviderService } from '../services/global-payment-provider.service';
import { GlobalPaymentProviderSharedModule } from './global-payment-provider-shared.module';

@Module({
  imports: [GlobalPaymentProviderSharedModule],
  controllers: [GlobalPaymentProviderController],
  providers: [GlobalPaymentProviderService]
})
export class GlobalPaymentProviderModule {}
