import { Expose } from 'class-transformer';

export class ProcessGauvendiPaymentInput {
  propertyId: string;
  currencyCode: string;
  paymentMethodId: string;
  customerId: string;
  customerEmail: string;
  prepaidAmount: number;
  applicationFee: number;

  bookingNumber: string;

  description: string;

  metadata: Record<string, string>;

  connectedAccount: string;
}

export class ProcessGauvendiPaymentDto {
  @Expose({ name: 'payment_method_id' })
  paymentMethodId: string;

  @Expose({ name: 'customer_id' })
  customerId: string;

  @Expose({ name: 'payment_intent_id' })
  paymentIntentId: string;

  @Expose({ name: 'client_secret' })
  clientSecret: string;

  status: string;
}

export class StorePaymentInformationDto {
  @Expose({ name: 'brand' })
  brand: string;
  @Expose({ name: 'masked_card_number' })
  maskedCardNumber: string;
  @Expose({ name: 'account_holder' })
  accountHolder: string;
  @Expose({ name: 'expiry_month' })
  expiryMonth: string;
  @Expose({ name: 'expiry_year' })
  expiryYear: number;
}

export class GetGVPaymentIntentDto {
  @Expose({ name: 'status' })
  status: string;
  @Expose({ name: 'payment_intent_id' })
  paymentIntentId: string;
  @Expose({ name: 'payment_method_id' })
  paymentMethodId: string;
}
