import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanRepository } from '../repositories/rate-plan.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlan], DB_NAME.POSTGRES), ConfigModule],
  providers: [RatePlanRepository],
  exports: [RatePlanRepository]
})
export class RatePlanSharedModule {}
