import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanPaymentSettlementSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-settlement-setting.entity';
import { RatePlanPaymentSettlementSettingRepository } from '../repositories/rate-plan-payment-settlement-setting.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RatePlanPaymentSettlementSetting], DB_NAME.POSTGRES),
    ConfigModule
  ],
  providers: [RatePlanPaymentSettlementSettingRepository],
  exports: [RatePlanPaymentSettlementSettingRepository]
})
export class RatePlanPaymentSettlementSettingSharedModule {}
