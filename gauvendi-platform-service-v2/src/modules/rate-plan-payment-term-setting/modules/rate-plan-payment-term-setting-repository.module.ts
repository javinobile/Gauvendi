import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanPaymentTermSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanDerivedSetting } from 'src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanPaymentTermSettingRepository } from '../repositories/rate-plan-payment-term-setting.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [RatePlanPaymentTermSetting, RatePlan, RatePlanDerivedSetting],
      DbName.Postgres
    ),
    ConfigModule
  ],
  providers: [RatePlanPaymentTermSettingRepository],
  exports: [RatePlanPaymentTermSettingRepository]
})
export class RatePlanPaymentTermSettingRepositoryModule {}
