import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import {
  RestrictionAutomationSettingFilterDto,
  RestrictionAutomationSettingInputDto
} from '../dtos/restriction-automation-setting.dto';
import { RestrictionAutomationSettingService } from '../services/restriction-automation-setting.service';

@Controller('restriction-automation-setting')
export class RestrictionAutomationSettingController {
  constructor(
    private readonly restrictionAutomationSettingService: RestrictionAutomationSettingService
  ) {}

  @MessagePattern({
    cmd: CMD.RESTRICTION_AUTOMATION_SETTING.GET_RATE_PLAN_RESTRICTION_AUTOMATION_SETTINGS
  })
  async ratePlanRestrictionAutomationSettingList(
    @Payload() filter: RestrictionAutomationSettingFilterDto
  ) {
    return await this.restrictionAutomationSettingService.getRatePlanRestrictionAutomationSettings(
      filter
    );
  }

  @MessagePattern({
    cmd: CMD.RESTRICTION_AUTOMATION_SETTING.GET_RESTRICTION_AUTOMATION_SETTINGS
  })
  async getRestrictionAutomationSettingList(
    @Payload() filter: RestrictionAutomationSettingFilterDto
  ) {
    return await this.restrictionAutomationSettingService.getRestrictionAutomationSettingList(
      filter
    );
  }

  @MessagePattern({
    cmd: CMD.RESTRICTION_AUTOMATION_SETTING.UPDATE_RESTRICTION_AUTOMATION_SETTINGS
  })
  async updateRestrictionAutomationSettings(
    @Payload() input: RestrictionAutomationSettingInputDto[]
  ) {
    return await this.restrictionAutomationSettingService.updateRestrictionAutomationSettings(
      input
    );
  }
}
