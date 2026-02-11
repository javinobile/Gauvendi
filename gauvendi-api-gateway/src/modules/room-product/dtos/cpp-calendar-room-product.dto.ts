import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { RfcAllocationSetting, RoomProductType } from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

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
  capacityExtra: number;
  extraBedAdult: number;
  extraBedKid: number;
  numberOfBedrooms: number;
  space: number;
  cppCalendarRoomProductSalesPlanList: CalendarRoomProductRatePlanDto[];
}

export interface RoomProductResultMap {
  [roomProductId: string]: RoomProductResultItemDto;
}

export enum SearchTextType {
  PRODUCT_NAME = "ProductName",
  ROOM_NUMBER = "RoomNumber",
}

export class CppCalendarRoomRequestDto {
  @IsInt()
  @IsOptional()
  adult?: number;

  @IsInt({ each: true })
  @OptionalArrayProperty()
  childrenAgeList?: number[];

  @IsInt()
  @IsOptional()
  pets?: number;
}

export class CppCalendarRoomProductFilterDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @IsString()
  @IsNotEmpty()
  toDate: string;

  @IsUUID(4, { each: true })
  @OptionalArrayProperty()
  ratePlanIds: string[];

  @IsString()
  @IsOptional()
  searchText?: string;

  @IsEnum(SearchTextType)
  @IsOptional()
  searchTextType?: SearchTextType;

  @IsString({ each: true })
  @OptionalArrayProperty()
  featureCodeList?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CppCalendarRoomRequestDto)
  roomRequests: CppCalendarRoomRequestDto[];

  @IsString({ each: true })
  @OptionalArrayProperty()
  promoCodes?: string[];

  @IsString()
  @IsOptional()
  translateTo?: string;
}

export interface CppCalendarRoomProductResultDto {
  rooms: { id: string; roomNumber: string }[];
  roomProductAvailabilities: RoomProductAvailabilityResultDto;
  roomProducts: RoomProductResultMap;
}