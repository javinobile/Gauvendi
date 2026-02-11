import { ConnectorTypeEnum, RoomProductPricingMethodAdjustmentUnitEnum, RoomProductPricingMethodEnum } from 'src/core/enums/common';

export class UpdateRoomProductPricingMethodDetailDto {
  from?: string;
  to?: string;
  hotelId: string;

  ratePlanId: string;

  roomProductId: string;

  isEnabled?: boolean;

  type: RoomProductPricingMethodEnum;

  value?: string;

  unit?: RoomProductPricingMethodAdjustmentUnitEnum;

  isPush?: boolean;

  targetRatePlanId?: string;

  targetRoomProductId?: string;

  pmsRatePlanCode?: string;

  mappingRoomProductId?: string;
  connectorType?: ConnectorTypeEnum;
  // isNoPushToPms?: boolean;
}

export class PmsEventPricingUpdateDto {
  connectorId: string;

  hotelId: string;

  // for Mews PMS
  RateId?: string; // mean rate plan pms code

  ResourceCategoryId?: string; // mean room product pms code

  StartUtc?: string; // mean start date

  EndUtc?: string; // mean end date
}

export interface ProcessRoomProductPricingDto {
  hotelId: string;
  roomProductId?: string;

  featureIds: string[];
}

export interface PushPmsRatePlanPricingDto {
  hotelId: string;
  from?: string;
  to?: string;
  connectorType?: ConnectorTypeEnum;
  ratePlanId: string;
  roomProductId: string;
  pmsRatePlanCode?: string;
  pmsRoomProductCode?: string;
}