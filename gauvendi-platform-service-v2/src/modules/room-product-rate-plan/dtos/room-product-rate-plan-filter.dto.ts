import { RatePlanStatusEnum } from '@src/core/enums/common';

export class RoomProductRatePlanFilterDto {
  idList?: string[];

  codeList?: string[];

  hotelIdList?: string[];

  roomProductIdList?: string[];

  ratePlanIdList?: string[];

  isAutomatePricing?: boolean;

  fromDate?: string;

  toDate?: string;

  guestCount?: number;

  ratePlanStatusList?: RatePlanStatusEnum[];

  promoCodeList?: string[];

  isSellable?: boolean;

  isPagination?: boolean;
}
