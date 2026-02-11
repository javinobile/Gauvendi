import { LanguageCodeEnum } from '../database/entities/base.entity';

export enum ResponseStatusEnum {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum ResponseCodeEnum {
  SUCCESS = '200',
  PENDING = '202',
  ERROR = '400'
}

export enum RoundingModeEnum {
  DOWN = 'DOWN',
  HALF_ROUND_UP = 'HALF_ROUND_UP',
  NO_ROUNDING = 'NO_ROUNDING',
  UP = 'UP'
}

export enum HotelIsePricingDisplayModeEnum {
  EXCLUSIVE = 'EXCLUSIVE',
  INCLUSIVE = 'INCLUSIVE'
}

export const RoundingMode = {
  UP: 0,
  DOWN: 1,
  CEILING: 2,
  FLOOR: 3,
  HALF_UP: 4,
  HALF_DOWN: 5,
  HALF_EVEN: 6,
  UNNECESSARY: 7
} as const;

export enum RatePlanAdjustmentType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE'
}

export enum RatePlanPaymentSettlementSettingModeEnum {
  PMS_SETTLEMENT = 'PMS_SETTLEMENT',
  MANUAL_SETTLEMENT = 'MANUAL_SETTLEMENT'
}

export enum BookingFlow {
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

//  Extra Service Enums
export enum ExtraServiceTypeEnum {
  INCLUDED = 'INCLUDED',
  EXTRA = 'EXTRA',
  MANDATORY = 'MANDATORY'
}

export const LOCALES_MAP = {
  [LanguageCodeEnum.EN]: 'en-EN',
  [LanguageCodeEnum.NL]: 'nl-NL',
  [LanguageCodeEnum.ES]: 'es-ES',
  [LanguageCodeEnum.IT]: 'it-IT',
  [LanguageCodeEnum.AR]: 'ar-AE',
  [LanguageCodeEnum.FR]: 'fr-FR',
  [LanguageCodeEnum.DE]: 'de-DE'
};

export enum RoomUnitStatus {
  CLEAN = 'CLEAN',
  DIRTY = 'DIRTY',
  INSPECTED = 'INSPECTED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}
