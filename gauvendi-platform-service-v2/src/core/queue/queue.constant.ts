export const QUEUE_NAMES = {
  RESTRICTION: 'restriction',
  ROOM_PRODUCT_PRICING: 'room_product_pricing'
};

export const JOB_NAMES = {
  APALEO_BOOKING: {
    PROCESS_APALEO_BOOKING_CREATED: 'process_apaleo_booking_created'
  },
  RESTRICTION: {
    PROCESS_PMS_RESTRICTION: 'process_pms_restriction',
    PROCESS_CM_RESTRICTION: 'process_cm_restriction',
    PROCESS_CLEAR_PMS_RESTRICTION: 'process_clear_pms_restriction'
  },

  ROOM_PRODUCT_PRICING: {
    PROCESS_ROOM_PRODUCT_FEATURE_BASED_PRICING: 'process_room_product_feature_based_pricing',
    PROCESS_ROOM_PRODUCT_SETTING_BASED_PRICING: 'process_room_product_setting_based_pricing',
    PROCESS_ROOM_PRODUCT_RATE_PLAN_PRICING: 'process_room_product_rate_plan_pricing'
  },
  RESERVATION: {
    PROCESS_UPDATE_RESERVATION: 'process_update_reservation'
  }
};

export const REDIS_DB = {
  APALEO_BOOKING: 9,
  RESERVATION: 10,
  RESTRICTION: 11
};

export const QUEUE_NAMES_ENV = {
  APALEO_BOOKING: process.env.BULL_APALEO_BOOKING_QUEUE || 'apaleo_booking',
  RESERVATION: process.env.BULL_RESERVATION_QUEUE || 'reservation'
} as const;
