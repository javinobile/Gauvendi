import { RoomRequestDto } from '@src/core/dtos/room-request.dto';
import { HotelRestrictionCodeEnum, RfcAllocationSetting, Weekday } from '@src/core/enums/common';
import { IsOptional, IsString } from 'class-validator';

export class CppCalculateRoomUnitExcludedDto {
  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  arrival?: string;

  @IsString()
  @IsOptional()
  departure?: string;
}

export interface CppCalculateRoomProductPriceFilterDto {
  arrival: string;
  departure: string;
  excludedList?: CppCalculateRoomUnitExcludedDto[];
  featureCodeList?: string[] | null;
  promoCodeList?: string[] | null;
  hotelId: string;
  roomId: string;
  roomRequestList: RoomRequestDto[];
  salesPlanIdList?: string[] | null;
}

export interface CppImageDto {
  url: string;
}

export interface CppRetailFeatureDto {
  code: string;
  name: string;
  iconUrl?: string;
  isMatched?: boolean;
}

export interface CppStandardFeatureDto {
  code: string;
  name: string;
  iconUrl?: string;
}

export interface CppRoomProductDto {
  maximumPet: number;
  roomProductId: string;
  roomProductCode: string;
  roomProductName: string;
  allocatedAdults: number;
  allocatedChildren: number;
  allocatedExtraAdults: number;
  allocatedExtraChildren: number;
  allocatedStrategy: RfcAllocationSetting;
  numberOfBedrooms: number;
  space: number;
  isLockedUnit: boolean;
  matchingPercentage?: number | null;
  imageList: CppImageDto[];
  retailFeatureList: CppRetailFeatureDto[];
  additionalRetailFeatureList: CppRetailFeatureDto[];
  standardFeatureList: CppStandardFeatureDto[];
}

export interface CppServiceDto {
  code: string;
  name: string;
  quantity: number;
  includedDates: string[];
  pricingUnit: string;
}

export interface CppRestrictionDto {
  code: HotelRestrictionCodeEnum;
  value: string;
  weekdays?: Weekday[];
  fromDate: string;
  toDate: string;
}

export interface CppSellableOptionDto {
  roomProductId: string;
  roomProductCode: string;
  salesPlanId: string;
  salesPlanCode: string;
  salesPlanName: string;
  salesPlanDescription?: string;
  roomProductSalesPlanId: string;
  roomProductSalesPlanCode: string;
  totalBaseAmount: number;
  totalTaxAmount: number;
  totalCityTaxAmount: number;
  totalGrossAmount: number;
  promoCode?: string;
  paymentTerm?: string;
  cxlPolicy?: string;
  includedServiceList: CppServiceDto[];
  restrictionList: CppRestrictionDto[];
}

export interface CppAssignedRoomDto {
  roomId: string;
  roomNumber: string;
}

export interface CppCalculateRoomProductPriceV2ResponseDto {
  roomProductList: CppRoomProductDto[];
  sellableOptionList: CppSellableOptionDto[];
  restrictionList: CppRestrictionDto[];
  assignedRoomList: CppAssignedRoomDto[];
}

export interface CppSmartFindingPromoCodeFilterDto {
  propertyCode: string;
  query?: string;
}

export interface CppSmartFindingPromoCodeDto {
  code: string;
  type: string;
  salesPlanId: string;
  salesPlanName: string;
  salesPlanCode: string;
}
