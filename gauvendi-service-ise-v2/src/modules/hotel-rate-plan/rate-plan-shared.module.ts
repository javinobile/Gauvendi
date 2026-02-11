import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanDerivedSetting } from 'src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { HotelSharedModule } from '../hotel-v2/modules/hotel-shared.module';
import { RatePlanDerivedSettingRepository } from './repositories/rate-plan-derived-setting.repository';
import { RatePlanRepository } from './repositories/rate-plan.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RatePlan, RatePlanDerivedSetting], DB_NAME.POSTGRES),
    ConfigModule,
    HotelSharedModule
  ],
  providers: [RatePlanRepository, RatePlanDerivedSettingRepository],
  exports: [RatePlanRepository, RatePlanDerivedSettingRepository]
})
export class RatePlanSharedModule {}
