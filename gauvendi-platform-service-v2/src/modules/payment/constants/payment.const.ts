export const PAYMENT_PROVIDER = {
  PAYPAL: 'PAYPAL',
  STRIPE: 'STRIPE',
  PAYMENT_GATEWAY: 'PAYMENT_GATEWAY',
  ADYEN: 'ADYEN',
  MEWS: 'MEWS',
  ONEPAY: 'ONEPAY'
};

export const PAYMENT_API_URL = {
  // Stripe endpoints
  PROCESS_STRIPE_PAYMENT: '/stripe/process-payment',
  GET_STRIPE_PAYMENT_METHOD: '/stripe/payment-method/{id}',
  GET_STRIPE_PAYMENT_INTENT: '/stripe/payment-intent/{id}',

  // Adyen endpoints
  PROCESS_ADYEN_PAYMENT: '/adyen/process-payment',
  ADYEN_PAYMENT_DETAILS: '/adyen/payment/details',

  // Mews endpoints
  CREATE_MEWS_CUSTOMER: '/mews-payment/customer',
  ADD_MEWS_CREDIT_CARD: '/mews-payment/credit-card/add',
  CHARGE_MEWS_CREDIT_CARD: '/mews-payment/credit-card/charge',

  // PayPal endpoints
  CREATE_PAYPAL_ORDER: '/paypal/orders/create',
  CAPTURE_PAYPAL_ORDER: '/paypal/orders/{id}/capture',

  // OnePay endpoints
  CREATE_ONEPAY_REQUEST_INVOICE: '/onepay/invoices/request'
};
