import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

// =======================
// ENUMS
// =======================
export enum ReservationPricingType {
  BeforeTaxes = 'BeforeTaxes',
  BeforeTaxesWithVat = 'BeforeTaxesWithVat',
  AfterTaxes = 'AfterTaxes'
}

export enum ChannelCode {
  Direct = 'Direct',
  BookingCom = 'BookingCom',
  Ibe = 'Ibe',
  ChannelManager = 'ChannelManager',
  Expedia = 'Expedia',
  Homelike = 'Homelike'
}
// =======================
// PAYMENT & CREDIT CARD
// =======================
export class ApaleoCreatePaymentAccountDto {
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsString()
  expiryMonth?: string;

  @IsOptional()
  @IsString()
  expiryYear?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @IsOptional()
  @IsString()
  payerReference?: string;

  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;
}
export class ApaleoPersonAddressDto {
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;
}
export class ApaleoCreditCardDto {
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cvc?: string;

  @IsOptional()
  @IsString()
  cardHolder?: string;

  @IsOptional()
  @IsString()
  expiryMonth?: string;

  @IsOptional()
  @IsString()
  expiryYear?: string;

  @IsOptional()
  @IsString()
  cardType?: string;

  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @IsOptional()
  @IsString()
  activationTime?: string; // ISO 8601
}

export class ApaleoPersonCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  taxId?: string;
}

// =======================
// PERSON INFORMATION
// =======================
export class ApaleoBookerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleInitial?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoPersonAddressDto)
  address?: ApaleoPersonAddressDto;

  @IsOptional()
  @IsString()
  nationalityCountryCode?: string;

  @IsOptional()
  @IsString()
  identificationNumber?: string;

  @IsOptional()
  @IsString()
  identificationType?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoPersonCompanyDto)
  company?: ApaleoPersonCompanyDto;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  birthDate?: string; // ISO 8601 date

  @IsOptional()
  @IsString()
  companyTaxId?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsString()
  companyCity?: string;

  @IsOptional()
  @IsString()
  companyCountry?: string;

  @IsOptional()
  @IsString()
  companyPostalCode?: string;
}

// =======================
// MAIN CREATE BOOKING INPUT
// =======================
export class ApaleoCreateBookingDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoCreatePaymentAccountDto)
  paymentAccount?: ApaleoCreatePaymentAccountDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoCreditCardDto)
  creditCard?: ApaleoCreditCardDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoBookerDto)
  booker?: ApaleoBookerDto;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  channelCode?: string;

  @IsOptional()
  @IsString()
  source?: string | null;

  @IsOptional()
  @IsString()
  bookerComment?: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoCreateReservationDto)
  reservations: ApaleoCreateReservationDto[];
}

export class ApaleoVehicleRegistrationDto {
  @IsString()
  number: string;

  @IsString()
  countryCode: string;
}

export class ApaleoGuestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleInitial?: string;

  @IsString()
  lastName: string; // Required

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoPersonAddressDto)
  address?: ApaleoPersonAddressDto;

  @IsOptional()
  @IsString()
  nationalityCountryCode?: string;

  @IsOptional()
  @IsString()
  identificationNumber?: string;

  @IsOptional()
  @IsString()
  identificationType?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoPersonCompanyDto)
  company?: ApaleoPersonCompanyDto;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  birthDate?: string; // ISO 8601 date

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoVehicleRegistrationDto)
  vehicleRegistration?: ApaleoVehicleRegistrationDto;

  @IsOptional()
  @IsString()
  companyTaxId?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsString()
  companyCity?: string;

  @IsOptional()
  @IsString()
  companyCountry?: string;

  @IsOptional()
  @IsString()
  companyPostalCode?: string;
}

export class ApaleoMonetaryValueDto {
  @IsNumber()
  amount: number; // BigDecimal

  @IsString()
  currency: string; // e.g., "EUR", "USD"
}

export class ApaleoCommissionDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoMonetaryValueDto)
  commissionAmount?: ApaleoMonetaryValueDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoMonetaryValueDto)
  beforeCommissionAmount?: ApaleoMonetaryValueDto;
}

// =======================
// RESERVATION INPUT
// =======================
export class ApaleoCreateReservationDto {
  id?: string | null;

  @IsString()
  arrival: string; // "YYYY-MM-DD" format e.g., "2021-12-22"

  @IsString()
  departure: string; // "YYYY-MM-DD" format e.g., "2021-12-24"

  @IsNumber()
  adults: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  childrenAges?: number[];

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  guestComment?: string;

  @IsOptional()
  @IsString()
  externalCode?: string;

  @IsOptional()
  @IsString()
  channelCode?: string;

  @IsOptional()
  @IsString()
  source?: string | null;

  @IsOptional()
  @IsEnum(ReservationPricingType)
  pricingType?: ReservationPricingType;

  @ValidateNested()
  @Type(() => ApaleoGuestDto)
  primaryGuest: ApaleoGuestDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoGuestDto)
  additionalGuests?: ApaleoGuestDto[];

  @IsOptional()
  @IsString()
  guaranteeType?: string;

  @IsOptional()
  @IsString()
  travelPurpose?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoCreateReservationTimeSliceDto)
  timeSlices?: ApaleoCreateReservationTimeSliceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoBookReservationServiceDto)
  services?: ApaleoBookReservationServiceDto[];

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  corporateCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoMonetaryValueDto)
  prePaymentAmount?: ApaleoMonetaryValueDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoCommissionDto)
  commission?: ApaleoCommissionDto;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsNumber()
  cityTaxAmount?: number;

  @IsOptional()
  @IsArray()
  reservationCityTaxList?: CityTaxMessage[];
}

// =======================
// PRICING & SERVICES
// =======================

export class ApaleoCreateReservationTimeSliceDto {
  @IsOptional()
  @IsString()
  ratePlanId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoMonetaryValueDto)
  totalAmount?: ApaleoMonetaryValueDto;
}

export class ApaleoServiceDateDto {
  @IsString()
  serviceDate: string; // "YYYY-MM-DD"

  @IsOptional()
  @IsNumber()
  count?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoMonetaryValueDto)
  amount?: ApaleoMonetaryValueDto;
}

export class ApaleoBookReservationServiceDto {
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsNumber()
  count?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApaleoMonetaryValueDto)
  amount?: ApaleoMonetaryValueDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoServiceDateDto)
  dates?: ApaleoServiceDateDto[];
}

export interface CityTaxMessage {
  // Define based on your specific city tax structure
  [key: string]: any;
}

// =======================
// API RESPONSE
// =======================
export class ApaleoCreateBookingResponseDto {
  @IsString()
  id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoCreateReservationResponseDto)
  reservationIds: ApaleoCreateReservationResponseDto[]; // with apaleo api

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoCreateReservationResponseDto)
  reservations: ApaleoCreateReservationResponseDto[]; // with apaleo distribution api
}

export class ApaleoCreateReservationResponseDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  externalId?: string;
}

export enum ApaleoPaymentMethod {
  CASH = 'Cash',
  BANK_TRANSFER = 'BankTransfer',
  CREDIT_CARD = 'CreditCard',
  AMEX = 'Amex',
  VISA_CREDIT = 'VisaCredit',
  VISA_DEBIT = 'VisaDebit',
  MASTER_CARD = 'MasterCard',
  MASTER_CARD_DEBIT = 'MasterCardDebit',
  MAESTRO = 'Maestro',
  GIRO_CARD = 'GiroCard',
  DISCOVER_CARD = 'DiscoverCard',
  DINERS = 'Diners',
  JCB = 'Jcb',
  BOOKING_COM = 'BookingCom',
  V_PAY = 'VPay',
  PAYPAL = 'PayPal',
  POSTCARD = 'Postcard',
  REKA = 'Reka',
  TWINT = 'Twint',
  LUNCHCHECK = 'Lunchcheck',
  VOUCHER = 'Voucher',
  CHINA_UNION_PAY = 'ChinaUnionPay',
  OTHER = 'Other',
  CHEQUE = 'Cheque',
  AIRBNB = 'Airbnb',
  HOLIDAY_CHECK = 'HolidayCheck',
  REPRESENTATION = 'Representation',
  IDEAL = 'IDeal'
}

export const ApaleoPaymentMethodMapping = {
  cash: ApaleoPaymentMethod.CASH,
  banktransfer: ApaleoPaymentMethod.BANK_TRANSFER,
  creditcard: ApaleoPaymentMethod.CREDIT_CARD,
  amex: ApaleoPaymentMethod.AMEX,
  visacredit: ApaleoPaymentMethod.VISA_CREDIT,
  visadebit: ApaleoPaymentMethod.VISA_DEBIT,
  mastercard: ApaleoPaymentMethod.MASTER_CARD,
  mastercarddebit: ApaleoPaymentMethod.MASTER_CARD_DEBIT,
  maestro: ApaleoPaymentMethod.MAESTRO,
  girocard: ApaleoPaymentMethod.GIRO_CARD,
  discovercard: ApaleoPaymentMethod.DISCOVER_CARD,
  diners: ApaleoPaymentMethod.DINERS,
  jcb: ApaleoPaymentMethod.JCB,
  bookingcom: ApaleoPaymentMethod.BOOKING_COM,
  vpay: ApaleoPaymentMethod.V_PAY,
  paypal: ApaleoPaymentMethod.PAYPAL,
  postcard: ApaleoPaymentMethod.POSTCARD,
  reka: ApaleoPaymentMethod.REKA,
  twint: ApaleoPaymentMethod.TWINT,
  lunchcheck: ApaleoPaymentMethod.LUNCHCHECK,
  voucher: ApaleoPaymentMethod.VOUCHER,
  chinaunionpay: ApaleoPaymentMethod.CHINA_UNION_PAY,
  other: ApaleoPaymentMethod.OTHER,
  cheque: ApaleoPaymentMethod.CHEQUE,
  airbnb: ApaleoPaymentMethod.AIRBNB,
  holidaycheck: ApaleoPaymentMethod.HOLIDAY_CHECK,
  representation: ApaleoPaymentMethod.REPRESENTATION,
  ideal: ApaleoPaymentMethod.IDEAL
};
