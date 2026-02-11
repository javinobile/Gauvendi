import { Module } from '@nestjs/common';
import { RoomProductRestrictionModule } from '@src/modules/room-product-restriction/room-product-restriction.module';
import { RestrictionAutomationSettingController } from '../controllers/restriction-automation-setting.controller';
import { RestrictionAutomationSettingService } from '../services/restriction-automation-setting.service';
import { RestrictionAutomationSettingSharedModule } from './restriction-automation-setting-shared.module';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';

@Module({
  imports: [
    RestrictionAutomationSettingSharedModule,
    RoomProductRestrictionModule,
    TypeOrmModule.forFeature([RoomProduct, RatePlan], DbName.Postgres)
  ],
  controllers: [RestrictionAutomationSettingController],
  providers: [RestrictionAutomationSettingService]
})
export class RestrictionAutomationSettingModule {}
