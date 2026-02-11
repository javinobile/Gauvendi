export const ApaleoApiConstants = {
  API_URL: 'https://identity.apaleo.com/connect/token',
  GET_PROPERTIES_URL: '{{APALEO_API}}/inventory/v1/properties',
  GET_UNIT_LIST_URL: '{{APALEO_API}}/inventory/v1/units',
  GET_UNIT_GROUP_LIST_URL: '{{APALEO_API}}/inventory/v1/unit-groups',
  GET_RATE_PLAN_LIST_URL: '{{APALEO_API}}/rateplan/v1/rate-plans',
  GET_SERVICE_LIST_URL: '{{APALEO_API}}/rateplan/v1/services',
  GET_RATE_PLAN_PRICING_LIST_URL: '{{APALEO_API}}/rateplan/v1/rate-plans/{ratePlanId}/rates',
  GET_AVAILABILITY_LIST_URL: '{{APALEO_API}}/availability/v1/unit-groups',
  GET_AVAILABILITY_UNIT_LIST_URL: '{{APALEO_API}}/availability/v1/units',
  RESERVATION: {
    GET_RESERVATION_LIST_URL: '{{APALEO_API}}/booking/v1/reservations',
    CANCEL_RESERVATION_URL: '{{APALEO_API}}/booking/v1/reservation-actions/{reservationId}/cancel'
  },
  BOOKING: {
    GET_BOOKING_URL: '{{APALEO_API}}/booking/v1/bookings/{bookingId}'
  },
  RATE: {
    PATCH_RATES: '{{APALEO_API}}/rateplan/v1/rates'
  }
};

export const PMS_APALEO_API_URI = {
  CREATE_BOOKING: '/booking/v1/bookings',
  ASSIGN_UNITS: '/booking/v1/reservation-actions/{id}/assign-unit/{unitId}',
  LOCK_UNIT: '/booking/v1/reservation-actions/{id}/lock-unit',
  UNLOCK_UNIT: '/booking/v1/reservation-actions/{id}/unlock-unit',
  GET_COMPANY: '/rateplan/v1/companies',
  CREATE_COMPANY: '/rateplan/v1/companies',
  UPDATE_RESERVATION: '/booking/v1/reservations/{id}',
  UPDATE_RESERVATIONS: '/booking/v1/reservations',
  GET_FOLIOS: '/finance/v1/folios',
  CREATE_FOLIOS_PAYMENT: '/finance/v1/folios/{foliosId}/payments',
  CREATE_FOLIOS_PAYMENT_BY_PAYMENT_ACCOUNT:
    '/finance/v1/folios/{foliosId}/payments/by-payment-account',
  CREATE_FOLIOS_PAYMENT_BY_AUTHORIZATION: '/finance/v1/folios/{foliosId}/payments/by-authorization'
};

export const PMS_APALEO_DISTRIBUTION_API_URI = {
  CREATE_BOOKING: '/v1/bookings'
};

export const IDENTITY_APALEO_API_URI = {
  UPDATE_CONNECTOR: '/connect/token'
};
