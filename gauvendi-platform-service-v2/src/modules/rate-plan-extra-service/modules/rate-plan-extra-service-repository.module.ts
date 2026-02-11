import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlanDailyExtraService } from '@src/core/entities/rate-plan-daily-extra-service.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanExtraService } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanExtraServiceRepository } from '../repositories/rate-plan-extra-service.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlanExtraService, RatePlanDailyExtraService], DbName.Postgres), ConfigModule],
  providers: [RatePlanExtraServiceRepository],
  exports: [RatePlanExtraServiceRepository]
})
export class RatePlanExtraServiceRepositoryModule {}
