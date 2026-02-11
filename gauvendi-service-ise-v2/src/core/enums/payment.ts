export enum PaymentModeCodeEnum {
  GUAINV = 'GUAINV', // Pay with invoice
  GUAWCC = 'GUAWCC', // Guarantee with credit card
  GUAWDE = 'GUAWDE', // Bank transfer
  NOGUAR = 'NOGUAR', // Reserve without credit card
  PAYPAL = 'PAYPAL', // PayPal payment
  PMDOTH = 'PMDOTH' // Other payment method
}

export enum PaymentProviderCodeEnum {
  APALEO_PAY = 'APALEO_PAY', // Apaleo payment provider
  GAUVENDI_PAY = 'GAUVENDI_PAY', // Gauvendi payment provider
  MEWS_PAYMENT = 'MEWS_PAYMENT', // Mews payment provider
  ADYEN = 'ADYEN', // Adyen payment provider
  PAYPAL = 'PAYPAL', // PayPal payment provider
  ONE_PAY = 'ONE_PAY', // OnePay payment provider
  OPI = 'OPI' // Oracle Payment Interface provider
}

export enum HotelPaymentAccountTypeEnum {
  STRIPE = 'STRIPE',
  ADYEN = 'ADYEN',
  MEWS_PAYMENT = 'MEWS_PAYMENT',
  GAUVENDI_PAYMENT = 'GAUVENDI_PAYMENT'
}