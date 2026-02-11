import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanDailySellability } from 'src/core/entities/pricing-entities/rate-plan-daily-sellability.entity';
import { RatePlanDailySellabilityRepository } from '../repositories/rate-plan-daily-sellability.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlanDailySellability], DbName.Postgres), ConfigModule],
  providers: [RatePlanDailySellabilityRepository],
  exports: [RatePlanDailySellabilityRepository]
})
export class RatePlanDailySellabilityRepositoryModule {}
