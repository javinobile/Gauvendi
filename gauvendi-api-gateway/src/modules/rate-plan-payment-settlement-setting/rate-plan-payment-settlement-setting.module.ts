import { Module } from '@nestjs/common';
import { RatePlanPaymentSettlementSettingService } from './rate-plan-payment-settlement-setting.service';
import { RatePlanPaymentSettlementSettingController } from './rate-plan-payment-settlement-setting.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  imports: [PlatformClientModule],
  controllers: [RatePlanPaymentSettlementSettingController],
  providers: [RatePlanPaymentSettlementSettingService],
})
export class RatePlanPaymentSettlementSettingModule {}
