import { Restriction, RestrictionMetadata, RestrictionSourceMap, RestrictionSourceType } from '@entities/restriction.entity';
import {
  HotelRestrictionCodeEnum,
  RestrictionConditionType,
  RestrictionLevel,
  RoomProductType,
  Weekday
} from 'src/core/enums/common';

export enum ModeEnumQuery {
  CREATED = 'created',
  UPDATED = 'updated',
  COLLIDING = 'colliding'
}

export class GetRestrictionsDto {
  hotelId: string;

  type?: RestrictionConditionType[];

  roomProductIds?: string[];

  ratePlanIds?: string[];

  fromDate?: string;

  toDate?: string;

  limit?: number;

  offset?: number;

  level?: RestrictionLevel;

  // Filter by presence/absence of restriction values
  hasMinLength?: boolean;

  hasMaxLength?: boolean;

  hasMinAdv?: boolean;

  hasMaxAdv?: boolean;

  hasMinLosThrough?: boolean;

  hasMaxReservationCount?: boolean;
}

export class CreateRestrictionDto {
  hotelId: string;

  type: RestrictionConditionType;
  weekdays: Weekday[];

  fromDate?: string;

  toDate?: string;

  ratePlanIds?: string[];

  roomProductIds?: string[];

  minLength?: number;

  maxLength?: number;

  minAdv?: number;

  maxAdv?: number;

  minLosThrough?: number;

  maxReservationCount?: number;

  metadata?: RestrictionMetadata;

  restrictionSource?: RestrictionSourceMap;
}

// Helper interface for creating restrictions with field-level source tracking
export interface CreateRestrictionWithSourceDto extends Omit<CreateRestrictionDto, 'restrictionSource'> {
  restrictionFieldSources?: {
    minLength?: RestrictionSourceType;
    maxLength?: RestrictionSourceType;
    minAdv?: RestrictionSourceType;
    maxAdv?: RestrictionSourceType;
    minLosThrough?: RestrictionSourceType;
    maxReservationCount?: RestrictionSourceType;
  };
}

export class UpsertRestrictionDto {
  restrictionsToCreate: Restriction[];

  restrictionsToRemove?: Restriction[];
}

export interface CheckDuplicateRestrictionResponse {
  hasDuplicates: boolean;
  duplicateCount: number;
  duplicateRestrictions: Restriction[];
}

export class BulkRestrictionOperationDto {
  restrictionsToAdd?: CreateRestrictionDto[];
}

export interface BulkRestrictionResponse {
  invalidRestrictions?: CreateRestrictionDto[];
  newRestrictionsToAdd?: Restriction[];
  restrictionsToDelete?: Restriction[];
  restrictionsToKeep?: Restriction[];
}

export class PmsRestrictionQueryDto {
  hotelId: string;

  startDate: string;

  endDate: string;

  mode?: ModeEnumQuery = ModeEnumQuery.COLLIDING;
}

export class RoomProductRestrictionQueryDto {
  hotelId: string;

  startDate: string;

  endDate: string;

  mode?: ModeEnumQuery = ModeEnumQuery.CREATED;
}

export class RoomProductRestrictionBodyDto {
  roomProductId: string;

  hotelId: string;

  minLos?: number;

  maxLos?: number;
}

export class RoomProductRestrictionAutomateSettingBodyDto {
  roomProductId: string;

  isAutomated: boolean;

  overrideDefault: boolean;

  overrideDefaultSetMaximum: boolean;

  hotelId: string;
}

export class CreatePmsRestrictionDto {
  startDate: string;

  endDate: string;

  hotelId: string;

  roomProductIds?: string[];
}

export class AutomateLosRequestDto {
  hotelId: string;

  fromDate?: string; // defaults to today

  toDate?: string; // defaults to today

  roomProductIds?: string[]; // if empty, process all active products
}

export class CalendarRestrictionDto {
  hotelId: string;

  startDate: string;

  endDate: string;
}

export class CalendarRestrictionDirectDto extends CalendarRestrictionDto {

  roomProductIds?: string[];
}

export class GetRatePlanRestrictionsDto {
  hotelId: string;

  ratePlanIds: string[];

  fromDate: string;
  toDate: string;
}

export class GetHotelRestrictionsDto {
  hotelId: string;

  fromDate: string;
  toDate: string;
}

export class GetRoomProductRestrictionsDto {
  hotelId: string;

  roomProductIds?: string[];
  roomProductTypes?: RoomProductType[];

  fromDate: string;
  toDate: string;
}

export interface RatePlanRestrictionsDailyList {
  dailyRestrictionList: {
    date: string;
    restrictionList: {
      code: HotelRestrictionCodeEnum;
      value: number | null;
      weekdays?: Weekday[];
      isAdjusted: boolean;
    }[];
  }[];
  hotelId: string;
  ratePlanId: string;
  fromDate: string;
  toDate: string;
}

export interface HotelRestrictionsDailyList {
  date: string;
  restrictionList: {
    code: HotelRestrictionCodeEnum;
    value: number | null;
    weekdays?: Weekday[];
    isAdjusted: boolean;
  }[];
  hotelId: string;
  fromDate: string;
  toDate: string;
}

export interface RoomProductRestrictionsDailyList {
  dailyRestrictionList: {
    date: string;
    restrictionList: {
      code: HotelRestrictionCodeEnum;
      value: number | null;
      weekdays?: Weekday[];
      isAdjusted: boolean;
    }[];
  }[];
  hotelId: string;
  rfcId: string;
  fromDate: string;
  toDate: string;
}

export class BulkDeleteRestrictionDto {
  hotelId: string;

  fromDate: string;

  level?: RestrictionLevel;

  toDate: string;
  
  ratePlanIds?: string[];

  roomProductIds?: string[];

  restrictionSource?: RestrictionSourceType;
}