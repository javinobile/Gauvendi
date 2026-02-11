import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { HotelRestrictionSettingMode } from "@src/core/enums/common.enum";
import { GetHotelIntegrationRestrictionSettingListQuery, HotelIntegrationRestrictionSettingInputDto, SyncPmsRestrictionSettingDto } from "./hotel-restriction-setting.dto";

@Injectable()
export class HotelRestrictionSettingService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getHotelIntegrationRestrictionSettingList(query: GetHotelIntegrationRestrictionSettingListQuery) {
    return this.platformClient.send({ cmd: "get_hotel_integration_restriction_setting" }, query);
  }

  upsertHotelIntegrationRestrictionSetting(body: HotelIntegrationRestrictionSettingInputDto[]) {
    return this.platformClient.send({ cmd: "upsert_hotel_integration_restriction_setting" }, body);
  }

  syncPmsRestrictionSetting(body: SyncPmsRestrictionSettingDto) {
    return this.platformClient.send({ cmd: "sync_pms_restriction_setting" }, body);
  }
}
