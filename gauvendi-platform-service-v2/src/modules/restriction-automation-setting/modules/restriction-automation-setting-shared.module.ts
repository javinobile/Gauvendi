import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RestrictionAutomationSetting } from '@src/core/entities/restriction-automation-setting.entity';
import { RestrictionAutomationSettingRepository } from '../repositories/restriction-automation-setting.repository';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RestrictionAutomationSetting, RoomProduct, RatePlan], DbName.Postgres)],
  providers: [RestrictionAutomationSettingRepository],
  exports: [RestrictionAutomationSettingRepository]
})
export class RestrictionAutomationSettingSharedModule {}
