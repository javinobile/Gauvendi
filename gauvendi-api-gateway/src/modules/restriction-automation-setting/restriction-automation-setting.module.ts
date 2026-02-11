import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { RestrictionAutomationSettingController } from "./restriction-automation-setting.controller";
import { RestrictionAutomationSettingService } from "./restriction-automation-setting.service";

@Module({
  controllers: [RestrictionAutomationSettingController],
  providers: [RestrictionAutomationSettingService],
  imports: [PlatformClientModule],
})
export class RestrictionAutomationSettingModule {}
