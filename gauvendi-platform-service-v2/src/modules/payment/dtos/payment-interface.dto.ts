// Stripe DTOs
export interface ProcessStripePaymentInput {
  amount: number;
  currency: string;
  paymentMethodId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ProcessStripePaymentDto {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface GetStripePaymentMethodDto {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface GetStripePaymentIntentDto {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  paymentMethodId?: string;
}

// Adyen DTOs

export interface CreditCardInformationInput {
  type: string | null;
  cardHolder: string | null;
  cardNumber: string | null;
  cvv: string | null;
  expiryMonth: string | null;
  expiryYear: string | null;
}

export interface AdyenPaymentAccount {
  type: string;
  account_holder: string;
  card_number: string;
  cvv: string;
  expMonth: string;
  expYear: string;
}

export interface ProcessAdyenPaymentInput {
  merchant_account: string;
  currency_code: string;
  amount: number;
  payment_account: AdyenPaymentAccount;
  reference: string;
  return_url: string;

  metadata?: Record<string, string>;
  deliver_at?: string; // ISO string if used
  additional_data?: Record<string, string>;
  browser_info?: any;
  origin?: string;
  shopper_IP?: string | null;
  shopper_email?: string;
  shopper_reference?: string;
  is_authorised_only?: boolean;
  enable_recurring?: boolean;
}

export interface BuildAdyenPaymentInputParams {
  amount: number;
  paymentInformation?: CreditCardInformationInput;
  bookerEmail: string;
  additionalData?: Record<string, string>;
  metadata?: Record<string, string>;
  browserInfo?: any;
  bookingNumber: string;
  browserIp?: string | null;
  currencyCode: string;
  merchantAccount: string;
  origin?: string;
  returnUrlTemplate: string; // expects two "%s" placeholders: whitelabelUrl, bookingId
  whitelabelUrl: string;
  bookingId: string;
  isAuthorizedOnly: boolean;
  isTestEnv: boolean;
  shopperReference: string;
  enableRecurring: boolean;
}

export interface ProcessAdyenPaymentDto {
  resultCode: string;
  action?: Record<string, any>;
  additionalData?: Record<string, any>;
}

export enum AdyenProcessPaymentResponseStatusEnum {
  AUTHORISED = 'Authorised',
  AUTHORISED_PENDING = 'AuthorisedPending',
  CANCELLED = 'Cancelled',
  CAPTURE_FAILED = 'CaptureFailed',
  ERROR = 'Error',
  EXPIRED = 'Expired',
  RECEIVED = 'Received',
  REFUSED = 'Refused',
  SENT_FOR_SETTLE = 'SentForSettle',
  SETTLE_SCHEDULED = 'SettleScheduled',
  SETTLED = 'Settled',
  SETTLED_EXTERNALLY = 'SettledExternally',
  REDIRECT_SHOPPER = 'RedirectShopper'
}

export interface AdyenProcessPaymentResponse {
  status: AdyenProcessPaymentResponseStatusEnum;
  amount?: number;
  psp_reference?: string;
  payment_method?: string;
  masked_card_number?: string;
  account_holder?: string;
  expiry_date?: string;
  refusal_reason?: string | null;
  action?: Record<string, any>;
}

export interface AdyenPaymentDetailsInput {
  details: Record<string, any>;
  paymentData: string;
}

export interface AdyenPaymentDetailsDto {
  status: AdyenProcessPaymentResponseStatusEnum;
  psp_reference: string;
  additional_data?: Record<string, any>;
}

// Mews DTOs
export interface MewsCreateCustomerInput {
  accessToken: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface MewsCreateCustomerResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AddMewsCreditCardInput {
  accessToken: string;
  customerId: string;
  storageData: string;
  expiration: string;
}

export interface AddMewsCreditCardDto {
  credit_card_id: string;
}

export interface ChargeMewsCreditCardInput {
  accessToken: string;
  creditCardId: string;
  grossAmount: number;
  currencyCode: string;
  note?: string;
}

export interface ChargeMewsCreditCardDto {
  payment_id: string;
}

// PayPal DTOs

export interface PayPalOrderDto {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// OnePay DTOs
export interface OnePayRequestInvoiceInput {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  dueDate?: string;
}

export interface OnePayRequestInvoiceDto {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paymentUrl: string;
}
