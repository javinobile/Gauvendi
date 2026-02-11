import { HotelRestrictionCodeEnum, HotelRestrictionSettingMode, RestrictionEntity } from '@src/core/enums/common';

export class HotelIntegrationRestrictionSettingDetailInput {
  mode: HotelRestrictionSettingMode;

  restrictionCode: HotelRestrictionCodeEnum;
}

export class HotelIntegrationRestrictionSettingInputDto {
  id?: string;

  integrationMappingCode?: string;

  hotelId: string;

  restrictionEntity?: RestrictionEntity;

  roomProductId?: string;

  salesPlanId?: string;

  modeList: HotelRestrictionSettingMode[];

  settingList?: HotelIntegrationRestrictionSettingDetailInput[];
}

export class GetHotelIntegrationRestrictionSettingListQuery {
  hotelId: string;

  modeList: HotelRestrictionSettingMode[];

  salesPlanIdList: string[];
}

export class PushPmsRestrictionBody {
  hotelId: string;
  roomProductIds: string[];

  salesPlanIds?: string[];
}