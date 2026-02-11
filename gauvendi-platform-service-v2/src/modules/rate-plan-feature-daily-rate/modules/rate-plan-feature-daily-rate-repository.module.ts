import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DbName } from 'src/core/constants/db-name.constant';
import { ConfigModule } from '@nestjs/config';
import { RatePlanFeatureDailyRate } from 'src/core/entities/pricing-entities/rate-plan-feature-daily-rate.entity';
import { RatePlanFeatureDailyRateRepository } from '../repositories/rate-plan-feature-daily-rate.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlanFeatureDailyRate], DbName.Postgres), ConfigModule],
  providers: [RatePlanFeatureDailyRateRepository],
  exports: [RatePlanFeatureDailyRateRepository]
})
export class RatePlanFeatureDailyRateRepositoryModule {}
