import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanDerivedSetting } from '../../../core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { ConfigModule } from '@nestjs/config';
import { RatePlanDailyAdjustmentRepository } from '../repositories/rate-plan-adjustment.repository';
import { RatePlanDailyAdjustment } from 'src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RoomProductPricingMethodDetailModule } from '@src/modules/room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.module';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlanDailyAdjustment, RatePlanDerivedSetting], DbName.Postgres), ConfigModule,

    RoomProductPricingMethodDetailModule,
  ],
  providers: [RatePlanDailyAdjustmentRepository],
  exports: [RatePlanDailyAdjustmentRepository]
})
export class RatePlanDailyAdjustmentRepositoryModule {}
