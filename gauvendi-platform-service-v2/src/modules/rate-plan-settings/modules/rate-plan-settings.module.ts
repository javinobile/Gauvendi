import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlanSellability } from '@src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanCxlPolicyDaily } from '@src/core/entities/rate-plan-cxl-policy-daily.entity';
import { RatePlanDailyExtraService } from '@src/core/entities/rate-plan-daily-extra-service.entity';
import { RatePlanDailyPaymentTerm } from '@src/core/entities/rate-plan-daily-payment-term.entity';
import { HotelAmenitySharedModule } from '@src/modules/hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelPaymentTermSharedModule } from '@src/modules/hotel-payment-term/modules/hotel-payment-term-shared.module';
import { RatePlanExtraServiceRepositoryModule } from '@src/modules/rate-plan-extra-service/modules/rate-plan-extra-service-repository.module';
import { RatePlanPaymentTermSettingRepositoryModule } from '@src/modules/rate-plan-payment-term-setting/modules/rate-plan-payment-term-setting-repository.module';
import { RatePlanRepositoryModule } from '@src/modules/rate-plan/modules/rate-plan-repository.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { HotelMarketSegment } from 'src/core/entities/hotel-entities/hotel-market-segment.entity';
import { RatePlanSettingsController } from '../controllers/rate-plan-settings.controller';
import { RatePlanDailyExtraServiceRepository } from '../repositories/rate-plan-daily-extra-service.repository';
import { RatePlanDailyPaymentTermRepository } from '../repositories/rate-plan-daily-payment-term.repository';
import { RatePlanDailyCancellationPolicyRepository } from '../repositories/rate-plan-daily-sellability.repository';
import { RatePlanSettingsService } from '../services/rate-plan-settings.service';
import { HotelCancellationPolicySharedModule } from '@src/modules/hotel-cancellation-policy/modules/hotel-cancellation-policy-shared.module';

@Module({
  imports: [
    RatePlanExtraServiceRepositoryModule,
    RatePlanRepositoryModule,
    RatePlanPaymentTermSettingRepositoryModule,
    HotelAmenitySharedModule,
    HotelPaymentTermSharedModule,
    HotelCancellationPolicySharedModule,
    TypeOrmModule.forFeature(
      [
        Connector,
        HotelMarketSegment,
        RatePlanSellability,
        RatePlan,
        RatePlanCxlPolicyDaily,
        RatePlanDailyPaymentTerm,
        RatePlanDailyExtraService
      ],
      DbName.Postgres
    ),
    ConfigModule
  ],
  controllers: [RatePlanSettingsController],
  providers: [
    RatePlanSettingsService,
    RatePlanDailyCancellationPolicyRepository,
    RatePlanDailyExtraServiceRepository,
    RatePlanDailyPaymentTermRepository
  ],
  exports: [RatePlanSettingsService]
})
export class RatePlanSettingsModule {}
