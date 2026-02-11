import { Module } from '@nestjs/common';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';
import { SettingsRatePlanController } from './settings-rate-plan.controller';
import { SettingsRatePlanService } from './settings-rate-plan.service';

@Module({
  imports: [PlatformClientModule],
  controllers: [SettingsRatePlanController],
  providers: [SettingsRatePlanService],
})
export class SettingsRatePlanModule {}
