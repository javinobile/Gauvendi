import {
  ConfiguratorModeEnum,
  ConfiguratorTypeEnum,
  ConnectorTypeEnum,
  RoomProductType
} from 'src/core/enums/common';

export class GetListRoomProductRatePlanDto {
  hotelId: string;

  roomProductId?: string;

  ratePlanId?: string;
}

export class UpdateRoomProductRatePlanConfigSettingDto {
  hotelId: string;

  roomProductRatePlanId: string;

  destination: string[];

  type: ConfiguratorTypeEnum;

  mode: ConfiguratorModeEnum;

  connectorType: ConnectorTypeEnum;
}

export class SyncRatePlanPricingDto {
  hotelId: string;

  ratePlanId: string;

  fromDate: string;

  toDate: string;
}

export class GetPmsRatePlanDto {
  hotelId: string;
  ratePlanId?: string;
  mappingRatePlanCodes?: string[];
  isRefreshData?: boolean;
}

export class UpdateRoomProductRatePlanSellabilityDto {
  hotelId: string;

  roomProductRatePlanId: string;

  isSellable: boolean;
}

export class GetRoomProductRatePlanIntegrationSettingDto {
  hotelId: string;

  ratePlanIds: string[];

  type: RoomProductType;
}
