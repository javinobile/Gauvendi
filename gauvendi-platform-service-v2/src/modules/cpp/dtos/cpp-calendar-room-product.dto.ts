import { RoomRequestDto } from '@src/core/dtos/room-request.dto';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { RfcAllocationSetting, RoomProductType } from '@src/core/enums/common';

export interface DailyRoomAvailabilityDto {
  date: string;
  availableRooms: 0 | 1;
  hasRate: boolean;
}

export interface RoomProductAvailabilityResultItemDto {
  available: boolean;
  roomId: string;
  roomProductId: string;
  dailyRoomAvailabilityList: DailyRoomAvailabilityDto[];
}

export interface RoomProductAvailabilityResultDto {
  [roomId: string]: RoomProductAvailabilityResultItemDto[];
}

export interface CppDailySellingRateDto {
  date: string;
  sellingRate: number;
  netPrice: number;
  grossPrice: number;
  taxAmount: number;
  cityTaxAmount: number;
}

export interface CalendarRoomProductRatePlanDto {
  roomProductSalesPlanId: string;
  roomProductSalesPlanCode: string;
  roomProductSalesPlanName: string;
  dailySellingRateList: CppDailySellingRateDto[];
}

export interface RoomProductResultItemDto {
  roomProductId: string;
  roomProductCode: string;
  roomProductName: string;
  allocationType: RfcAllocationSetting;
  roomProductType: RoomProductType;
  capacityDefault: number;
  capacityAdult: number;
  capacityChildren: number;
  maximumPet: number;
  capacityExtra: number;
  extraBedAdult: number;
  extraBedKid: number;
  numberOfBedrooms: number;
  space: number;
  cppCalendarRoomProductSalesPlanList: CalendarRoomProductRatePlanDto[];
  matchingPercentage: number;
  roomProductFeatureList: any[];
}

export interface RoomProductResultMap {
  [roomProductId: string]: RoomProductResultItemDto;
}

export interface CppCalendarRoomProductFilterDto {
  hotelId: string;
  fromDate: string;
  toDate: string;
  ratePlanIds: string[];
  searchText?: string;
  searchTextType?: 'ProductName' | 'RoomNumber';
  featureCodeList?: string[];
  roomRequests: RoomRequestDto[];
  translateTo?: string;
  promoCodes?: string[];
}

export interface CppCalendarRoomProductResultDto {
  rooms: RoomUnit[];
  roomProductAvailabilities: RoomProductAvailabilityResultDto;
  roomProducts: RoomProductResultMap;
}
