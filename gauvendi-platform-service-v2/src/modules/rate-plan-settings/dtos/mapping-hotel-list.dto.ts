import { RatePlanStatusEnum } from '@src/core/enums/common';

export class RatePlanListDto {
  hotelIds: string[];
}

export class MarketSegmentListDto extends RatePlanListDto {
  ids?: string[];
}

export class SalesPlanSellabilityListDto extends RatePlanListDto {
  ratePlanIds?: string[];
}

export class AvailableSalesPlanToDeriveListDto extends RatePlanListDto {
  status?: RatePlanStatusEnum;
}

export class SalesPlanSellabilityListResponseDto {
  propertyId: string;
  salesPlanId: string;
  distributionChannel: string;
  isSellable: boolean;
}

export class MappingHotelListDto extends RatePlanListDto {}
