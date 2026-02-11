export const APALEO_APIS = {
  API_URL: 'https://identity.apaleo.com/connect/token',
  GET_PROPERTIES_URL: '{{APALEO_API}}/inventory/v1/properties',
  GET_UNIT_LIST_URL: '{{APALEO_API}}/inventory/v1/units',
  GET_UNIT_GROUP_LIST_URL: '{{APALEO_API}}/inventory/v1/unit-groups',
  GET_RATE_PLAN_LIST_URL: '{{APALEO_API}}/rateplan/v1/rate-plans',
  GET_SERVICE_LIST_URL: '{{APALEO_API}}/rateplan/v1/services',
  GET_RATE_PLAN_PRICING_LIST_URL: '{{APALEO_API}}/rateplan/v1/rate-plans/{ratePlanId}/rates',
  PATCH_RATE_PLAN_SERVICE_URL: '{{APALEO_API}}/rateplan/v1/services/{serviceId}',
  GET_AVAILABILITY_LIST_URL: '{{APALEO_API}}/availability/v1/unit-groups',
  GET_AVAILABILITY_UNIT_LIST_URL: '{{APALEO_API}}/availability/v1/units',
  RESERVATION: {
    GET_RESERVATION_LIST_URL: '{{APALEO_API}}/booking/v1/reservations',
    GET_RESERVATION_URL: '{{APALEO_API}}/booking/v1/reservations/{reservationId}',
    CANCEL_RESERVATION_URL: '{{APALEO_API}}/booking/v1/reservation-actions/{reservationId}/cancel',
    PATCH_RESERVATION_PRIMARY_GUEST_URL: '{{APALEO_API}}/booking/v1/reservations/{reservationId}'
  },
  BOOKING: {
    GET_BOOKING_URL: '{{APALEO_API}}/booking/v1/bookings/{bookingId}',
    PATCH_BOOKER_URL: '{{APALEO_API}}/booking/v1/bookings/{bookingId}'
  },
  SUBSCRIPTION_WEBHOOK: 'https://webhook.apaleo.com/v1/subscriptions',

  RATE: {
    PATCH_RATES: '{{APALEO_API}}/rateplan/v1/rates'
  },
  TAX: {
    HOTEL_TAX: '{{APALEO_API}}/finance/v1/types/vat',
    CITY_TAX: '{{APALEO_API}}/settings/v1/city-tax'
  },
  FINANCE: {
    GET_FOLIOS_URL: '{{APALEO_API}}/finance/v1/folios'
  },
  UNIT: {
    LOCK_UNIT: '{{APALEO_API}}/booking/v1/reservation-actions/{id}/lock-unit',
    UNLOCK_UNIT: '{{APALEO_API}}/booking/v1/reservation-actions/{id}/unlock-unit'
  },
  BLOCK: {
    GET_BLOCK_URL: '{{APALEO_API}}/booking/v1/blocks/{blockId}',
    GET_BLOCKS_URL: '{{APALEO_API}}/booking/v1/blocks'
  },
  AVAILABILITY: {
    UPDATE_AVAILABILITY_URL: '{{APALEO_API}}/availability/v1/unit-groups/{unitGroupId}'
  },
  MAINTENANCE: {
    GET_MAINTENANCE_URL: '{{APALEO_API}}/operations/v1/maintenances/{maintenanceId}',
    GET_MAINTENANCES_URL: '{{APALEO_API}}/operations/v1/maintenances',
    BULK_MAINTENANCES_URL: '{{APALEO_API}}/operations/v1/maintenances/bulk',
    DELETE_MAINTENANCE_URL: '{{APALEO_API}}/operations/v1/maintenances/{maintenanceId}'
  },
  FOLIO: {
    GET_FOLIO_URL: '{{APALEO_API}}/finance/v1/folios/{folioId}'
  }
};

export const APALEO_WEBHOOK_EVENT_TYPES = {
  RESERVATION: {
    CREATED: 'reservation/created',
    CHANGED: 'reservation/changed',
    CANCELED: 'reservation/canceled',
    DELETED: 'reservation/deleted',
    UNIT_ASSIGNED: 'reservation/unit-assigned',
    UNIT_UNASSIGNED: 'reservation/unit-unassigned',
    AMENDED: 'reservation/amended',
    SET_TO_NO_SHOW: 'reservation/set-to-no-show'
  },
  // BOOKING: {
  //   CREATED: 'booking/created',
  //   CHANGED: 'booking/changed',
  //   DELETED: 'booking/deleted'
  // }
  UNIT: {
    CREATED: 'unit/created',
    CHANGED: 'unit/changed',
    DELETED: 'unit/deleted'
  },
  RATE_PLAN: {
    CREATED: 'rateplan/created',
    CHANGED: 'rateplan/changed',
    DELETED: 'rateplan/deleted'
  },
  CITY_TAX: {
    CREATED: 'citytax/created',
    CHANGED: 'citytax/changed',
    DELETED: 'citytax/deleted'
  },
  SERVICE: {
    CREATED: 'service/created',
    CHANGED: 'service/changed',
    DELETED: 'service/deleted'
  },
  BLOCK: {
    CREATED: 'block/created',
    CHANGED: 'block/changed',
    DELETED: 'block/deleted',
    CONFIRMED: 'block/confirmed',
    CANCELED: 'block/cancelled',
    RELEASED: 'block/released'
  },
  MAINTENANCE: {
    CREATED: 'maintenance/created',
    CHANGED: 'maintenance/changed',
    DELETED: 'maintenance/deleted'
  },
  FOLIO: {
    PAYMENT_POSTED: 'folio/payment-posted',
    PAYMENT_FAILED: 'folio/payment-failed',
    PAYMENT_CANCELED: 'folio/payment-canceled',
    REFUND_POSTED: 'folio/refund-posted',
    REFUND_FAILED: 'folio/refund-failed'
  }
};

export const APALEO_WEBHOOK_EVENTS: string[] = Object.values(APALEO_WEBHOOK_EVENT_TYPES).flatMap(
  (group) => Object.values(group)
);
