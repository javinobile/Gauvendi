import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanExtraService } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanDailyExtraService } from 'src/core/entities/rate-plan-daily-extra-service.entity';
import { RatePlanExtraServicesRepository } from './rate-plan-extra-services.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlanExtraService, RatePlanDailyExtraService], DB_NAME.POSTGRES), ConfigModule],
  providers: [RatePlanExtraServicesRepository],
  exports: [RatePlanExtraServicesRepository]
})
export class RatePlanExtraServicesRepositoryModule {}
