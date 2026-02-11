export interface CppRatePlanRequestDto {
  adult: number;
  childrenAgeList?: number[];
}

export interface CppRatePlanFilterDto {
  arrival: string;
  departure: string;
  featureCodeList: string[];
  promoCodeList?: string[];
  hotelId: string;
  roomRequestList: CppRatePlanRequestDto[];
  translateTo?: string
}

export interface CppRatePlanResultDto {
  id: string;
  name: string;
  code: string;
  description: string;
  promoCodeList: string[];
  availableProducts: number;
  appliedPromoCodeList: string[] | null;
}
