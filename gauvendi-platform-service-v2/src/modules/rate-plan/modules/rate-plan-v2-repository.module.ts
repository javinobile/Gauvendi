import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import { RatePlanDailyAdjustment } from '@src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlan } from '../../../core/entities/pricing-entities/rate-plan.entity';
import { RatePlanV2Repository } from '../repositories/rate-plan-v2.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RatePlan,RatePlanDerivedSetting, RatePlanDailyAdjustment], DbName.Postgres),
    ConfigModule
  ],
  providers: [RatePlanV2Repository],
  exports: [RatePlanV2Repository]
})
export class RatePlanV2RepositoryModule {}
