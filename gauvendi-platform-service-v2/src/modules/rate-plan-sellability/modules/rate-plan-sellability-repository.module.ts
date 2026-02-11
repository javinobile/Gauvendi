import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlanDailySellability } from '@src/core/entities/pricing-entities/rate-plan-daily-sellability.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanSellability } from 'src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RatePlanDailySellabilityRepository } from '../repositories/rate-plan-daily-sellability.repository';
import { RatePlanSellabilityRepository } from '../repositories/rate-plan-sellability.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [RatePlanSellability, RatePlanDailySellability],
      DbName.Postgres
    ),
    ConfigModule
  ],
  providers: [RatePlanSellabilityRepository, RatePlanDailySellabilityRepository],
  exports: [RatePlanSellabilityRepository, RatePlanDailySellabilityRepository]
})
export class RatePlanSellabilityRepositoryModule {}
