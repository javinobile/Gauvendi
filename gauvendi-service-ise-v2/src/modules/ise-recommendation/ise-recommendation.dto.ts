import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { BookingFlow } from 'src/core/enums/common';

export class NearestBookableDateDto {
  @IsString()
  hotelCode: string;

  @IsString()
  fromDate: string;
}

export class RoomRequestDto {
  @IsInt()
  adult: number;

  @IsArray()
  childrenAgeList: number[];

  @IsInt()
  pets: number;
}

export class PriorityCategoryCodeDto {
  @IsArray()
  codeList: string[];

  @IsInt()
  sequence: number;
}

export class StayOptionsDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsString()
  @IsNotEmpty()
  arrival: string;

  @IsString()
  @IsNotEmpty()
  departure: string;

  @IsEnum(BookingFlow)
  @IsNotEmpty()
  bookingFlow: BookingFlow = BookingFlow.DIRECT;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PriorityCategoryCodeDto)
  priorityCategoryCodeList?: PriorityCategoryCodeDto[] = [];

  @IsString()
  @IsOptional()
  translateTo?: string;

  @IsArray()
  @IsOptional()
  travelTagCodeList?: string[] = [];

  @IsArray()
  @IsOptional()
  occasionCodeList?: string[] = [];

  @IsArray()
  @IsOptional()
  promoCodeList?: string[] = [];

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RoomRequestDto)
  roomRequestList: RoomRequestDto[];

  @IsArray()
  @IsOptional()
  spaceTypeRequestList?: string[] = [];

  @IsBoolean()
  @IsOptional()
  splitToDoubleRooms?: boolean = false;
}

export class StayOptionDetailsDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsString()
  @IsNotEmpty()
  dedicatedProductCode: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PriorityCategoryCodeDto)
  priorityCategoryCodeList?: PriorityCategoryCodeDto[] = [];

  @IsString()
  @IsNotEmpty()
  arrival: string;

  @IsString()
  @IsNotEmpty()
  departure: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RoomRequestDto)
  roomRequest: RoomRequestDto;

  @IsString()
  @IsOptional()
  translateTo?: string;

  @IsArray()
  @IsOptional()
  promoCodeList?: string[] = [];
}
