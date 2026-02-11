import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNumber,
  Min
} from 'class-validator';
import { Filter } from 'src/core/dtos/common.dto';

class RoomRequestListDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  adult: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  childrenAgeList?: number[];

  @IsNumber()
  @IsOptional()
  pets?: number;
}

export enum BookingFlowEnum {
  LOWEST_PRICE = 'LOWEST_PRICE',
  MOST_POPULAR = 'MOST_POPULAR',
  DIRECT = 'DIRECT',
  MATCH = 'MATCH',
  OPERATOR = 'OPERATOR',
  OTHER = 'OTHER',
  RECOMMENDED = 'RECOMMENDED',
  VOICE = 'VOICE',
  CALL_PRO_PLUS = 'CALL_PRO_PLUS'
}

export class StayOptionRecommendationFilterDto extends Filter {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsString()
  @IsNotEmpty()
  arrival: string;

  @IsString()
  @IsNotEmpty()
  departure: string;

  @IsArray()
  @IsNotEmpty()
  roomRequestList: RoomRequestListDto[];

  @IsArray()
  @IsNotEmpty()
  travelTagCodeList: string[];

  @IsArray()
  @IsNotEmpty()
  occasionCodeList: string[];

  @IsArray()
  @IsNotEmpty()
  promoCodeList: string[];

  @IsEnum(BookingFlowEnum)
  @IsNotEmpty()
  bookingFlow: BookingFlowEnum;

  @IsArray()
  @IsOptional()
  spaceTypeRequestList?: string[];

  @IsBoolean()
  splitToDoubleRooms: boolean;

  @IsBoolean()
  @IsOptional()
  isCombination?: boolean;
}

export class RoomProductResponseDto {
  roomProductList: any[];
}
