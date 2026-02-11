import { Transform, Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { ArrayProperty, OptionalArrayProperty } from "src/core/decorators/array-property.decorator";
import { RestrictionConditionType, RestrictionLevel, Weekday } from "src/core/enums/common.enum";

export enum ModeEnumQuery {
  CREATED = "created",
  UPDATED = "updated",
  COLLIDING = "colliding",
}
export class GetRestrictionsDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  @IsOptional()
  type?: RestrictionConditionType[];

  @ArrayProperty()
  @IsOptional()
  roomProductIds?: string[];

  @ArrayProperty()
  @IsOptional()
  ratePlanIds?: string[];

  @IsString()
  @IsOptional()
  fromDate?: string;

  @IsString()
  @IsOptional()
  toDate?: string;

  // Filter by presence/absence of restriction values
  @IsBoolean()
  @IsOptional()
  hasMinLength?: boolean;

  @IsBoolean()
  @IsOptional()
  hasMaxLength?: boolean;

  @IsBoolean()
  @IsOptional()
  hasMinAdv?: boolean;

  @IsBoolean()
  @IsOptional()
  hasMaxAdv?: boolean;

  @IsBoolean()
  @IsOptional()
  hasMinLosThrough?: boolean;

  @IsBoolean()
  @IsOptional()
  hasMaxReservationCount?: boolean;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  offset?: number;

  @IsString()
  @IsOptional()
  level?: string;
}

export class CreateRestrictionDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsEnum(RestrictionConditionType)
  @IsNotEmpty()
  type: RestrictionConditionType;

  @IsArray({ message: "Weekdays must be an array" })
  @IsOptional()
  @IsEnum(Weekday, {
    each: true,
    message: `Each weekday must be a valid Weekday enum value ${Object.values(Weekday).join(", ")}`,
  })
  weekdays: Weekday[];

  @IsString()
  @IsOptional()
  fromDate?: string;

  @IsString()
  @IsOptional()
  toDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? (Array.isArray(value) ? value : [value]) : undefined))
  ratePlanIds?: string[];

  @IsOptional()
  @Transform(({ value }) => (value ? (Array.isArray(value) ? value : [value]) : undefined))
  roomProductIds?: string[];

  @IsNumber()
  @IsOptional()
  minLength?: number;

  @IsNumber()
  @IsOptional()
  maxLength?: number;

  @IsNumber()
  @IsOptional()
  minAdv?: number;

  @IsNumber()
  @IsOptional()
  maxAdv?: number;

  @IsNumber()
  @IsOptional()
  minLosThrough?: number;

  @IsNumber()
  @IsOptional()
  maxReservationCount?: number;

  @IsString()
  @IsOptional()
  id?: string;

  @IsObject()
  @IsOptional()
  restrictionSource?: any;
}

export class BulkRestrictionOperationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRestrictionDto)
  @IsOptional()
  restrictionsToAdd?: CreateRestrictionDto[];
}

export class UpsertRestrictionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRestrictionDto)
  @IsNotEmpty()
  restrictionsToCreate: CreateRestrictionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRestrictionDto)
  @IsOptional()
  restrictionsToRemove?: CreateRestrictionDto[];
}

export class PmsRestrictionQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(ModeEnumQuery)
  @IsOptional()
  mode?: ModeEnumQuery = ModeEnumQuery.COLLIDING;
}

export class RoomProductRestrictionQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(ModeEnumQuery)
  @IsOptional()
  mode?: ModeEnumQuery = ModeEnumQuery.CREATED;
}

export class RoomProductRestrictionBodyDto {
  @IsString()
  @IsNotEmpty()
  roomProductId: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsNumber()
  @IsOptional()
  minLos?: number;

  @IsNumber()
  @IsOptional()
  maxLos?: number;
}

export class RoomProductRestrictionAutomateSettingBodyDto {
  @IsString()
  @IsNotEmpty()
  roomProductId: string;

  @IsBoolean()
  @IsNotEmpty()
  isAutomated: boolean;

  @IsBoolean()
  @IsNotEmpty()
  overrideDefault: boolean;

  @IsBoolean()
  @IsNotEmpty()
  overrideDefaultSetMaximum: boolean;

  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class CreatePmsRestrictionDto {
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  roomProductIds?: string[];
}

export class AutomateLosRequestDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsOptional()
  fromDate?: string; // defaults to today

  @IsString()
  @IsOptional()
  toDate?: string; // defaults to today

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  roomProductIds?: string[]; // if empty, process all active products
}

export class CalendarRestrictionDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;
}


export class GetBaseRestrictionsDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  fromDate: string;

  @IsString()
  @IsNotEmpty()
  toDate: string;
}


export class GetRatePlanRestrictionsDto extends GetBaseRestrictionsDto {
  @ArrayProperty()
  ratePlanIds: string[];
}

export class GetHotelRestrictionsDto extends GetBaseRestrictionsDto {
}

export class GetRoomProductRestrictionsDto extends GetBaseRestrictionsDto {
  @OptionalArrayProperty()
  roomProductIds?: string[];

  @OptionalArrayProperty()
  roomProductTypes?: string[];
}

export class BulkDeleteRestrictionDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  fromDate: string;

  @IsEnum(RestrictionLevel)
  @IsOptional()
  level?: RestrictionLevel;

  @IsString()
  @IsNotEmpty()
  toDate: string;
  
  @IsOptional()
  @Transform(({ value }) => (value ? (Array.isArray(value) ? value : [value]) : undefined))
  ratePlanIds?: string[];

  @IsOptional()
  @Transform(({ value }) => (value ? (Array.isArray(value) ? value : [value]) : undefined))
  roomProductIds?: string[];
}