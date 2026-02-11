import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { HotelAgeCategoryCodeEnum } from "@src/core/enums/common.enum";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class HotelAgeCategoryQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @OptionalArrayProperty()
  sort?: string[];
}

export class CreateHotelAgeCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(HotelAgeCategoryCodeEnum)
  @IsNotEmpty()
  code: HotelAgeCategoryCodeEnum;

  @IsNumber()
  @IsNotEmpty()
  fromAge: number;

  @IsNumber()
  @IsNotEmpty()
  toAge: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class UpdateHotelAgeCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(HotelAgeCategoryCodeEnum)
  @IsOptional()
  code?: HotelAgeCategoryCodeEnum;

  @IsNumber()
  @IsOptional()
  fromAge?: number;

  @IsNumber()
  @IsOptional()
  toAge?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsBoolean()
  @IsOptional()
  isIncludeExtraOccupancyRate?: boolean;
}

export class GetHotelAgeCategoryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}