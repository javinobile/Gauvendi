export const WS_EVENTS = {
  BOOKING: {
    SERVER: {
      PAYMENT_STATUS: 'ws-booking-server-payment-status',
      DISCONNECTED: 'ws-booking-server-disconnected',
      JOINED: 'ws-booking-server-joined'
    },
    CLIENT: {
      JOIN: 'ws-booking-client-join',
      PAYMENT_STATUS: 'ws-booking-client-payment-status',
      DISCONNECT: 'ws-booking-client-disconnect'
    }
  },
  COMMON: {
    DISCONNECT_TIMEOUT: 5000
  }
};

export const WS_ROOMS = {
  BOOKING: 'booking'
};
