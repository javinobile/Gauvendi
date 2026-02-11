import { LanguageCodeEnum } from '@src/core/enums/common';

export const RESERVATION_TITLE = '***IMPORTANT***';

export const RESERVATION_NOTES_KEYS = {
  bookingSource: {
    key: 'BOOKING_SOURCE',
    defaultKeyvalue: 'Booking Source'
  },
  channel: {
    key: 'CHANNEL',
    defaultKeyvalue: 'Channel'
  },
  bookingFlow: {
    key: 'BOOKING_FLOW',
    defaultKeyvalue: 'Booking Flow'
  },
  guestLanguage: {
    key: 'GUEST_LANGUAGE',
    defaultKeyvalue: 'Guest Language'
  },
  specialRequest: {
    key: 'SPECIAL_REQUEST',
    defaultKeyvalue: 'Special Request'
  },
  paymentConditions: {
    key: 'PAYMENT_CONDITIONS',
    defaultKeyvalue: 'Payment Conditions'
  },
  cancellationConditions: {
    key: 'CANCELLATION_CONDITIONS',
    defaultKeyvalue: 'Cancellation Conditions'
  },
  productName: {
    key: 'PRODUCT_NAME',
    defaultKeyvalue: 'Product Name'
  },
  productCode: {
    key: 'PRODUCT_CODE',
    defaultKeyvalue: 'Product Code'
  },
  ratePlanName: {
    key: 'RATE_PLAN_NAME',
    defaultKeyvalue: 'Rate Plan Name'
  },
  ratePlanCode: {
    key: 'RATE_PLAN_CODE',
    defaultKeyvalue: 'Rate Plan Code'
  },
  guaranteedUnitFeatures: {
    key: 'GUARANTEED_UNIT_FEATURES',
    defaultKeyvalue: 'Guaranteed Unit Features'
  },
  alternativeUnitsAssigned: {
    key: 'ALTERNATIVE_UNITS_ASSIGNED',
    defaultKeyvalue: 'Alternative Units to be Assigned'
  },
  assignedUnitLocked: {
    key: 'ASSIGNED_UNIT_LOCKED',
    defaultKeyvalue: 'Assigned Unit Locked'
  },
  proposalExpiry: {
    key: 'PROPOSAL_EXPIRY',
    defaultKeyvalue: 'Proposal Expiry'
  },
  promoCode: {
    key: 'PROMO_CODE',
    defaultKeyvalue: 'Promo Code'
  },
  tripPurpose: {
    key: 'TRIP_PURPOSE',
    defaultKeyvalue: 'Trip Purpose'
  }
};

export const BOOKING_FLOW_MAP = {
  LOWEST_PRICE: 'Lowest Price',
  MOST_POPULAR: 'Most Popular',
  DIRECT: 'Direct',
  MATCH: 'Match',
  OPERATOR: 'Operator',
  OTHER: 'Other',
  RECOMMENDED: 'Recommended',
  VOICE: 'Voice',
  CALL_PRO_PLUS: 'Call Pro Plus'
};

export const CHANNEL_MAP = {
  'GV VOICE': 'Call-Pro',
  'GV SALES ENGINE': 'Sales Engine',
  SITEMINDER: 'Siteminder'
};

export const LOCALES_MAP = {
  [LanguageCodeEnum.EN]: 'en-EN',
  [LanguageCodeEnum.NL]: 'nl-NL',
  [LanguageCodeEnum.ES]: 'es-ES',
  [LanguageCodeEnum.IT]: 'it-IT',
  [LanguageCodeEnum.AR]: 'ar-AE',
  [LanguageCodeEnum.FR]: 'fr-FR',
  [LanguageCodeEnum.DE]: 'de-DE'
};
