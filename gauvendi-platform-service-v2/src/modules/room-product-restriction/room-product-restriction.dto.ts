import { RestrictionSourceMap } from "@src/core/entities/restriction.entity";

export enum ModeEnumQuery {
  CREATED = 'created',
  UPDATED = 'updated',
  COLLIDING = 'colliding'
}

export class RoomProductRestrictionQueryDto {
  hotelId: string;

  startDate: string;

  endDate: string;

  mode?: ModeEnumQuery = ModeEnumQuery.CREATED;
}

export class RoomProductRestriction {
  fromDate: string;

  toDate: string;

  minLength?: number | undefined;

  maxLength?: number | undefined;

  roomProductId: string;

  hotelId: string;

  restrictionSource?: RestrictionSourceMap;
}

export class RoomProductRestrictionAutomateSettingBodyDto {
  roomProductId: string;

  isAutomated: boolean;

  overrideDefault: boolean;

  overrideDefaultSetMaximum: boolean;

  hotelId: string;
}

export class RoomProductRestrictionDto {
  startDate: string;

  endDate: string;

  hotelId: string;

  roomProductIds?: string[]; // if empty, process all active products
}

export class AutomateLosRequestDto {
  hotelId: string;

  fromDate?: string; // defaults to today

  toDate?: string; // defaults to today

  roomProductIds: string[]; // if empty, process all active products
}

export class TriggerLosRestrictionDto {
  hotelId: string;
}
