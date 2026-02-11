import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator';
import { RatePlanTypeEnum } from 'src/core/entities/pricing-entities/rate-plan.entity';

export enum RestrictionConditionType {
  ClosedToStay = 'ClosedToStay',
  ClosedToArrival = 'ClosedToArrival',
  ClosedToDeparture = 'ClosedToDeparture'
}

export class LowestPriceResponseDto {
  price: number;
  ratePlanId: string;
  roomProductId: string;
  date: string;
  netPrice: number;
  grossPrice: number;
}

export class CalendarRoomProductSellabilityQueryDto {
  @IsString()
  propertyCode: string;

  @IsString()
  fromDate: string;

  @IsString()
  toDate: string;

  @IsInt()
  @Min(1)
  totalAdult: number;

  @IsInt()
  @IsOptional()
  totalPet: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  childAgeList?: number[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  roomProductCodes?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  promoCodeList?: string[];

  @IsArray()
  @IsOptional()
  @IsEnum(RatePlanTypeEnum, { each: true })
  ratePlanTypes?: RatePlanTypeEnum[];
}

export class RoomProductRequestDto {
  @IsString()
  id: string;

  @IsString()
  code: string;

  @IsString()
  name: string;
}

export class CalendarQueryDto {
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  childAgeList: number[];

  @IsString()
  fromDate: string;

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsString()
  propertyCode: string;

  @IsString()
  toDate: string;

  @IsNumber()
  totalAdult: number;

  @IsNumber()
  @IsOptional()
  totalPet: number;
}

export class CalendarRoomProductQueryDto extends CalendarQueryDto {
  @IsArray()
  @IsString({ each: true })
  dedicatedProductCodeList: string[];
}

export class CalendarRestrictionQueryDto {
  @IsString()
  fromDate: string;

  @IsString()
  propertyCode: string;

  @IsString()
  toDate: string;
}

export class CalendarDirectRestrictionQueryDto extends CalendarRestrictionQueryDto {
  @IsArray()
  @IsString({ each: true })
  roomProductIds: string[];
}

export class CalendarAvailabilityQueryDto {
  childAgeList?: number[];
  fromDate: string;
  hotelId: string;
  toDate: string;
  totalAdult: number;
  totalPet?: number;
  types: string[];
}

export class CalendarRoomProductAvailabilityQueryDto {
  fromDate: string;
  hotelId: string;
  toDate: string;
  roomProductCodeList: string[];
}

export interface CalendarRestrictionDto {
  type: RestrictionConditionType;
  fromDate: string;
  toDate: string;
  minLength: number;
  maxLength: number;
  minAdv: number;
  maxAdv: number;
  minLosThrough: number;
  maxReservationCount: number;
}

export interface CalendarRoomProductDto {
  id: string;
  maximumAdult: number;
  maximumKid: number;
  maximumPet: number;
  numberOfBedrooms: number;
  type: string;
  code: string;
  name: string;
  status: string;
  distributionChannel: string[];
}

export interface CalendarAvailabilityPerDateDto {
  date: string;
  availability: number;
}

export class CalendarSellabilityQueryDto {
  @IsString()
  propertyCode: string;
  @IsArray()
  roomProductIds: string[];
  @IsString()
  fromDate: string;
  @IsString()
  toDate: string;
  @IsNumber()
  totalAdult: number;
  @IsNumber()
  totalChildren: number;
  @IsNumber()
  totalPet: number;
  @IsArray()
  @IsNumber({}, { each: true })
  childAgeList: number[];
}

export interface SellabilityCalendarZip {
  dict: {
    roomProducts: string[];
    ratePlans: string[];
  };

  /**
   * Each entry = 1 (roomProduct, ratePlan)
   * timeline is RLE by date
   */
  series: Array<{
    rp: number; // roomProduct index
    plan: number; // ratePlan index
    timeline: Array<
      [
        fromDay: number, // day offset
        toDay: number, // day offset
        isSellable: 0 | 1
      ]
    >;
  }>;

  baseDate: string; // YYYY-MM-DD
}
