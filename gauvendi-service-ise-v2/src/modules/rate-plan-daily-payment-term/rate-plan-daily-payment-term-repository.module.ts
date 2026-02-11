import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanDailyPaymentTerm } from 'src/core/entities/rate-plan-daily-payment-term.entity';
import { RatePlanDailyPaymentTermRepository } from './rate-plan-daily-payment-term.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlanDailyPaymentTerm], DB_NAME.POSTGRES), ConfigModule],
  providers: [RatePlanDailyPaymentTermRepository],
  exports: [RatePlanDailyPaymentTermRepository]
})
export class RatePlanDailyPaymentTermRepositoryModule {}
