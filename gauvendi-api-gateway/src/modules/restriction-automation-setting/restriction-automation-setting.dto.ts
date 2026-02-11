import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Filter } from "@src/core/dtos/common.dto";
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export enum RestrictionAutomationSettingTypeEnum {
  ROOM_PRODUCT = "ROOM_PRODUCT",
  RATE_PLAN = "RATE_PLAN",
}

import { GapModeEnum } from "@src/core/enums/common.enum";

export enum WeekdayEnum {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export interface RestrictionAutomationSettings {
  minLOS?: number; // minimum length of stay
  maxLOS?: number; // maximum length of stay
  minLOSThrough?: {
    [key in WeekdayEnum]: number;
  }; // minimum length of stay through
  maxLOSThrough?: {
    [key in WeekdayEnum]: number;
  }; // maximum length of stay through
  minAdv?: number; // minimum advance booking
  maxAdv?: number; // maximum advance booking
  isCTA?: boolean; // is Closed To Arrival
  isCTD?: boolean; // is Closed To Departure
  gapMode?: GapModeEnum; // gap mode
  [key: string]: any; // allow future extension
}

export interface RestrictionAutomationSettingRules {
  occupancyThreshold?: {
    // occupancy threshold
    operator: "lt" | "lte" | "eq" | "gte" | "gt"; // <, <=, =, >=, >
    value: number; // % occupancy
  };
  [key: string]: any; // allow future extension
}

export class RestrictionAutomationSettingFilterDto extends Filter {
  @IsUUID()
  hotelId: string;

  @IsUUID()
  @IsOptional()
  referId?: string;

  @OptionalArrayProperty()
  @IsEnum(RestrictionAutomationSettingTypeEnum, { each: true })
  types?: RestrictionAutomationSettingTypeEnum[];
}

export class RestrictionAutomationSettingInputDto {
  @IsUUID()
  hotelId: string;

  @IsEnum(RestrictionAutomationSettingTypeEnum)
  type: RestrictionAutomationSettingTypeEnum;

  @IsUUID()
  @IsString()
  referenceId: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean; 

  @IsOptional()
  @IsObject()
  rules?: RestrictionAutomationSettingRules;

  @IsOptional()
  @IsObject()
  settings?: RestrictionAutomationSettings;
  
}
