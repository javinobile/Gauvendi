export const PMS_APALEO_API_URI = {
  CREATE_BOOKING: '/booking/v1/bookings',
  ASSIGN_UNITS: '/booking/v1/reservation-actions/{id}/assign-unit/{unitId}',
  LOCK_UNIT: '/booking/v1/reservation-actions/{id}/lock-unit',
  UNLOCK_UNIT: '/booking/v1/reservation-actions/{id}/unlock-unit',
  GET_COMPANY: '/rateplan/v1/companies',
  GET_SERVICE_LIST: '/rateplan/v1/services',
  CREATE_COMPANY: '/rateplan/v1/companies',
  UPDATE_RESERVATION: '/booking/v1/reservations/{id}',
  UPDATE_RESERVATIONS: '/booking/v1/reservations',
  GET_FOLIOS: '/finance/v1/folios',
  CREATE_FOLIOS_PAYMENT: '/finance/v1/folios/{foliosId}/payments',
  CREATE_FOLIOS_PAYMENT_BY_PAYMENT_ACCOUNT:
    '/finance/v1/folios/{foliosId}/payments/by-payment-account',
  CREATE_FOLIOS_PAYMENT_BY_AUTHORIZATION: '/finance/v1/folios/{foliosId}/payments/by-authorization'
};

export const IDENTITY_APALEO_API_URI = {
  UPDATE_CONNECTOR: '/connect/token'
};

export const PMS_APALEO_DISTRIBUTION_API_URI = {
  CREATE_BOOKING: '/v1/bookings'
};
