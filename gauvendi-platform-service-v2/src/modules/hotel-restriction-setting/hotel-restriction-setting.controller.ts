import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { HotelRestrictionSettingService } from './hotel-restriction-setting.service';
import {
  GetHotelIntegrationRestrictionSettingListQuery,
  HotelIntegrationRestrictionSettingInputDto
} from './hotel-restriction-setting.dto';
import { HotelRestrictionSettingMode, RestrictionEntity } from '@src/core/enums/common';
import { CRON_JOB_CMD } from '@src/core/constants/cmd.const';
import { Logger } from '@nestjs/common';

@Controller()
export class HotelRestrictionSettingController {
  private readonly logger = new Logger(HotelRestrictionSettingController.name);
  constructor(private readonly hotelRestrictionSettingService: HotelRestrictionSettingService) {}

  @MessagePattern({ cmd: 'get_hotel_integration_restriction_setting' })
  async getHotelIntegrationRestrictionSetting(
    @Payload() payload: GetHotelIntegrationRestrictionSettingListQuery
  ) {
    return this.hotelRestrictionSettingService.getHotelIntegrationRestrictionSetting(payload);
  }

  @MessagePattern({ cmd: 'upsert_hotel_integration_restriction_setting' })
  async upsertHotelIntegrationRestrictionSettings(
    @Payload() body: HotelIntegrationRestrictionSettingInputDto[]
  ) {
    return this.hotelRestrictionSettingService.upsertHotelIntegrationRestrictionSettings(body);
  }

  @MessagePattern({ cmd: 'sync_pms_restriction_setting' })
  async syncPmsRestrictionSetting(
    @Payload() body: { hotelId: string; restrictionEntity: RestrictionEntity }
  ) {
    return this.hotelRestrictionSettingService.syncPmsRestrictionSetting(body);
  }

  @MessagePattern({ cmd: 'job_pull_pms_restrictions' })
  async jobPullPmsRestrictions() {
    return this.hotelRestrictionSettingService.jobPullPmsRestrictions();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_PULL_PMS_RESTRICTIONS })
  async jobPullPmsRestrictionsEvent() {
    this.logger.debug('Cron job: pull pms restrictions event');
    return this.hotelRestrictionSettingService.jobPullPmsRestrictions();
  }
}
