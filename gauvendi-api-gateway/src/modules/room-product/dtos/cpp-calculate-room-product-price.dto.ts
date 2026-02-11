import { Optional } from "@nestjs/common";
import { ArrayProperty, OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { RoomRequestDto } from "@src/core/dtos/room-request.dto";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

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

export class CppCalculateRoomProductPriceFilterDto {
  @IsDateString()
  @IsNotEmpty()
  arrival: string;

  @IsDateString()
  @IsNotEmpty()
  departure: string;

  // @ArrayProperty()
  // @IsOptional()
  // excludedList?: CppCalculateRoomUnitExcludedDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CppCalculateRoomUnitExcludedDto)
  excludedList?: CppCalculateRoomUnitExcludedDto[];

  @IsArray()
  @IsOptional()
  featureCodeList?: string[] | null;

  @IsArray()
  @IsOptional()
  promoCodeList?: string[] | null;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoomRequestDto)
  roomRequestList?: RoomRequestDto[];

  @IsArray()
  @IsOptional()
  salesPlanIdList?: string[] | null;
}
