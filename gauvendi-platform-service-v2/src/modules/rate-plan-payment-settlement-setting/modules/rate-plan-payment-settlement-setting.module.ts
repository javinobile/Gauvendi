import { Module } from '@nestjs/common';
import { RatePlanPaymentSettlementSettingService } from '../services/rate-plan-payment-settlement-setting.service';
import { RatePlanPaymentSettlementSettingSharedModule } from './rate-plan-payment-settlement-setting-shared.module';
import { RatePlansModule } from '../../rate-plans/rate-plans.module';
import { HotelRepositoryModule } from '../../hotel/modules/hotel-repository.module';
import { RatePlanPaymentSettlementSettingController } from '../rate-plan-payment-settlement-setting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { DbName } from '@src/core/constants/db-name.constant';

@Module({
  imports: [
    RatePlanPaymentSettlementSettingSharedModule,
    RatePlansModule,
    HotelRepositoryModule,
    TypeOrmModule.forFeature([RatePlan], DbName.Postgres)
  ],
  controllers: [RatePlanPaymentSettlementSettingController],
  providers: [RatePlanPaymentSettlementSettingService],
  exports: [RatePlanPaymentSettlementSettingService]
})
export class RatePlanPaymentSettlementSettingModule {}
