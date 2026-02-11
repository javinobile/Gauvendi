import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { BookingFlow } from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

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

  @OptionalArrayProperty()
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
