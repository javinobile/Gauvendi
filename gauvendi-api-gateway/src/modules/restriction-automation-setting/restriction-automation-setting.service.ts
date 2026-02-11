import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { RestrictionAutomationSettingFilterDto, RestrictionAutomationSettingInputDto } from "./restriction-automation-setting.dto";

@Injectable()
export class RestrictionAutomationSettingService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getRatePlanRestrictionAutomationSettingList(query: RestrictionAutomationSettingFilterDto) {
    return this.platformClient.send({ cmd: CMD.RESTRICTION_AUTOMATION_SETTING.GET_RATE_PLAN_RESTRICTION_AUTOMATION_SETTINGS }, query);
  }

  getRoomProductRestrictionAutomationSettingList(query: RestrictionAutomationSettingFilterDto) {
    return this.platformClient.send({ cmd: CMD.RESTRICTION_AUTOMATION_SETTING.GET_ROOM_PRODUCT_RESTRICTION_AUTOMATION_SETTINGS }, query);
  }

  getRestrictionAutomationSettingList(query: RestrictionAutomationSettingFilterDto) {
    return this.platformClient.send({ cmd: CMD.RESTRICTION_AUTOMATION_SETTING.GET_RESTRICTION_AUTOMATION_SETTINGS }, query);
  }

  updateRestrictionAutomationSetting(body: RestrictionAutomationSettingInputDto[]) {
    return this.platformClient.send({ cmd: CMD.RESTRICTION_AUTOMATION_SETTING.UPDATE_RESTRICTION_AUTOMATION_SETTINGS }, body);
  }
}
