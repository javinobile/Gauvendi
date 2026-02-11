import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanCxlPolicyDaily } from 'src/core/entities/rate-plan-cxl-policy-daily.entity';
import { RatePlanCancellationPolicyDailyRepository } from './rate-plan-cancellation-policy-daily.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlanCxlPolicyDaily], DB_NAME.POSTGRES), ConfigModule],
  providers: [RatePlanCancellationPolicyDailyRepository],
  exports: [RatePlanCancellationPolicyDailyRepository]
})
export class RatePlanCancellationPolicyDailyRepositoryModule {}
