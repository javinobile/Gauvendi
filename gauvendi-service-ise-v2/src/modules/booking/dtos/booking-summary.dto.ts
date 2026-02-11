import { Translation } from 'src/core/database/entities/base.entity';

export interface CountryResponseDto {
  code: string;
  name: string;
  phoneCode: string;
  translationList: Translation[];
}

export interface BrandResponseDto {
  name: string;
}

export interface BookingSummaryBookerDto {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  countryId: string;
  country: string | null;
  postalCode: string | null;
  phoneNumber: string;
  countryNumber: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  companyName: string | null;
  companyCity: string | null;
  companyTaxId: string | null;
  companyAddress: string | null;
  companyCountry: string | null;
  companyEmail: string | null;
  companyPostalCode: string | null;
}

export interface BookingSummaryCountryDto {
  name: string;
  id: string;
}

export interface BookingSummaryGuestDto {
  id: string;
  isBooker: boolean | null;
  isMainGuest: boolean | null;
  isReturningGuest: boolean | null;
  countryId: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  city: string | null;
  state: string | null;
  emailAddress: string | null;
  countryNumber: string | null;
  postalCode: string | null;
  isAdult: boolean;
  country: BookingSummaryCountryDto | null;
  address: string | null;
}

export interface BookingSummaryPaymentTermDto {
  name: string;
  code: string;
  description: string;
  payAtHotelDescription: string;
  payOnConfirmationDescription: string;
}

export interface BookingSummaryCancellationPolicyDto {
  name: string;
  description: string;
}

export interface BookingSummaryRfcImageDto {
  imageUrl: string;
}

export interface BookingSummaryRetailFeatureImageDto {
  imageUrl: string;
}

export interface BookingSummaryHotelRetailCategoryDto {
  code: string;
}

export interface BookingSummaryRetailFeatureDto {
  name: string;
  code: string;
  measurementUnit: string | null;
  hotelRetailCategory: BookingSummaryHotelRetailCategoryDto;
  retailFeatureImageList: BookingSummaryRetailFeatureImageDto[];
}

export interface BookingSummaryStandardFeatureDto {
  name: string;
  code: string;
  iconImageUrl: string;
}

export interface BookingSummaryRfcDto {
  name: string;
  description: string | null;
  numberOfBedrooms: number;
  extraBedKid: number;
  extraBedAdult: number;
  space: number;
  rfcImageList: BookingSummaryRfcImageDto[];
  retailFeatureList: BookingSummaryRetailFeatureDto[];
  standardFeatureList: BookingSummaryStandardFeatureDto[];
}

export interface BookingSummaryMatchedFeatureDto {
  code: string;
  name: string;
  quantity: number;
  description: string | null;
  retailFeatureImageList: BookingSummaryRetailFeatureImageDto[];
}

export interface BookingSummaryRatePlanDto {
  name: string;
  code: string;
  description: string;
}

export interface BookingSummaryRfcRatePlanDto {
  ratePlan: BookingSummaryRatePlanDto;
}

export interface BookingSummaryHotelAmenityDto {
  id: string;
  name: string;
  code: string;
  displaySequence: number | null;
  iconImageUrl: string;
}

export interface BookingSummaryReservationAmenityDateDto {
  id: string;
  date: string;
  totalBaseAmount: number;
  totalGrossAmount: number;
  serviceChargeAmount: number;
  taxAmount: number;
  totalSellingRate: number;
  count: number;
}

export interface BookingSummaryReservationAmenityDto {
  id: string;
  totalBaseAmount: number;
  totalGrossAmount: number;
  serviceChargeAmount: number;
  taxAmount: number;
  totalSellingRate: number;
  hotelAmenity: BookingSummaryHotelAmenityDto;
  reservationAmenityDateList: BookingSummaryReservationAmenityDateDto[];
}

export interface BookingSummaryPrimaryGuestDto {
  id: string;
  countryId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  city: string | null;
  state: string | null;
  emailAddress: string;
  countryNumber: string;
  postalCode: string | null;
  isAdult: boolean;
  country: BookingSummaryCountryDto;
  address: string;
  isBooker: boolean | null;
  isMainGuest: boolean | null;
}

export interface BookingSummaryReservationDto {
  id: string;
  additionalGuest: any[];
  primaryGuest: BookingSummaryPrimaryGuestDto;
  reservationNumber: string;
  status: string;
  adult: number;
  childrenAgeList: number[];
  pets: number;
  arrival: Date;
  departure: Date;
  specialRequest: string | null;
  guestNote: string | null;
  totalBaseAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
  cityTaxAmount: number;
  totalGrossAmount: number;
  totalSellingRate: number;
  payOnConfirmationAmount: number;
  payAtHotelAmount: number;
  totalAccommodationAmount: number;
  paymentTerm: BookingSummaryPaymentTermDto;
  cxlPolicy: BookingSummaryCancellationPolicyDto;
  rfc: BookingSummaryRfcDto;
  matchedFeatureList: BookingSummaryMatchedFeatureDto[];
  rfcRatePlan: BookingSummaryRfcRatePlanDto;
  tripPurpose: string;
  company: object | null;
  reservationAmenityList: BookingSummaryReservationAmenityDto[];
}

export interface BookingSummaryTransactionDto {
  id: string;
  transactionNumber: string | null;
  status: string;
  accountNumber: string | null;
  accountHolder: string | null;
  expiryMonth: string | null;
  expiryYear: string | null;
  cardType: string | null;
  totalAmount: number;
}

export class BookingSummaryResponseDto {
  id: string;
  status: string;
  bookingNumber: string;
  arrival: Date;
  departure: Date;
  acceptTnc: boolean;
  totalAdult: number;
  cancelledDate: Date | null;
  totalChildren: number;
  payOnConfirmationAmount: number;
  payAtHotelAmount: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  totalSellingRate: number;
  bookingFlow: string;
  specialRequest: string | null;
  booker: BookingSummaryBookerDto;
  guestList: BookingSummaryGuestDto[];
  additionalGuest: any[];
  bookingCityTaxList: any[] | null;
  bookingTaxList: any[];
  cityTaxList: any[];
  paymentTerm: BookingSummaryPaymentTermDto | null;
  cxlPolicy: BookingSummaryCancellationPolicyDto | null;
  reservationList: BookingSummaryReservationDto[];
  hotelPaymentModeCode: string;
  hotelPaymentMethodSettings: any;
  bookingTransactionList: BookingSummaryTransactionDto[];
  cityTaxAmount?: number;
}
