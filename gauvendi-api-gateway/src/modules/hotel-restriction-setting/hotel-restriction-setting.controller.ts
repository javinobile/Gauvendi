import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { GetHotelIntegrationRestrictionSettingListQuery, HotelIntegrationRestrictionSettingInputDto, SyncPmsRestrictionSettingDto } from "./hotel-restriction-setting.dto";
import { HotelRestrictionSettingService } from "./hotel-restriction-setting.service";
import { HotelRestrictionSettingMode } from "@src/core/enums/common.enum";

@Controller("hotel-restriction-setting")
export class HotelRestrictionSettingController {
  constructor(private readonly hotelRestrictionSettingService: HotelRestrictionSettingService) {}

  @Get("integration")
  getHotelIntegrationRestrictionSettingList(@Query() query: GetHotelIntegrationRestrictionSettingListQuery) {
    return this.hotelRestrictionSettingService.getHotelIntegrationRestrictionSettingList(query);
  }

  @Post("integration")
  upsertHotelIntegrationRestrictionSetting(@Body() body: HotelIntegrationRestrictionSettingInputDto[]) {
    return this.hotelRestrictionSettingService.upsertHotelIntegrationRestrictionSetting(body);
  }

  @Post("sync-pms")
  syncPmsRestrictionSetting(@Body() body: SyncPmsRestrictionSettingDto) {
    return this.hotelRestrictionSettingService.syncPmsRestrictionSetting(body);
  }

}
