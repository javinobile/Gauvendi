import { Filter } from '@src/core/dtos/common.dto';
import { ReservationStatusEnum } from '@src/core/entities/booking-entities/reservation.entity';
import {
  HotelAmenity,
  HotelAmenityAgeCategoryPricingDto
} from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import {
  CityTaxChargeMethodEnum,
  ExtraServiceTypeEnum,
  IsePricingDisplayModeEnum,
  LanguageCodeEnum,
  RoomProductStatus,
  RoomProductType,
  SellingTypeEnum
} from '@src/core/enums/common';
import { RatePlanDto } from '@src/modules/rate-plan/dto';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import Decimal from 'decimal.js';
import { Translation } from 'src/core/database/entities/base.entity';

export enum BookingForm {
  ISE = 'ISE'
}

export class BookingSummaryFilterDto extends Filter {
  @IsUUID()
  bookingId?: string;
}

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
  hotelId: string | null;
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
  price: number;
  pricingUnit: string;
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
  extraServiceType: ExtraServiceTypeEnum;
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
  paymentMethod?: any;
  paymentMethodName?: string;
  cxlPolicy: BookingSummaryCancellationPolicyDto;
  rfc: BookingSummaryRfcDto;
  matchedFeatureList: BookingSummaryMatchedFeatureDto[];
  rfcRatePlan: BookingSummaryRfcRatePlanDto;
  tripPurpose: string;
  company: object | null;
  reservationAmenityList: BookingSummaryReservationAmenityDto[];
  bookingDate?: any;
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
  hotelId: string | null;
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
  primaryGuest: BookingSummaryPrimaryGuestDto | null;
  guestList: BookingSummaryGuestDto[];
  additionalGuest: any[];
  bookingCityTaxList: any[] | null;
  bookingTaxList: any[];
  cityTaxList: any[];
  paymentTerm: BookingSummaryPaymentTermDto | null;
  cxlPolicy: BookingSummaryCancellationPolicyDto | null;
  reservationList: BookingSummaryReservationDto[];
  hotelPaymentModeCode: string;
  bookingTransactionList: BookingSummaryTransactionDto[];
  cityTaxAmount: number;
  currencyCode: string;
}

export class BookingFilterDto extends Filter {
  bookingMappingCodes?: string[];
  hotelId?: string;
  bookingNumber?: string;
  status?: ReservationStatusEnum;
  ids?: string[];
}

// Mapping DTOs for the target format
export interface BookingMappedRoomDto {
  roomNumber: string;
}

export interface BookingMappedReservationRoomDto {
  room: BookingMappedRoomDto;
}

export interface BookingMappedReservationDto {
  id: string;
  status: string;
  reservationRoomList: BookingMappedReservationRoomDto[];
}

export interface BookingMappedBookerDto {
  firstName: string;
  lastName: string;
}

export interface BookingMappedResponseDto {
  id: string;
  specialRequest: string | null;
  bookingLanguage: string | null;
  bookingNumber: string;
  totalBaseAmount: number | null;
  totalGrossAmount: number | null;
  serviceChargeAmount: number | null;
  taxAmount: number | null;
  balance: number | null;
  status: string;
  bookingFlow: string | null;
  hotelPaymentModeCode: string | null;
  hotelPaymentMode: string | null;
  totalAdult: number;
  totalChildren: number;
  reservationList: BookingMappedReservationDto[];
  bookingMetadataList: any[];
  guaranteeType: string | null;
  arrival: string | null;
  departure: string | null;
  booker: BookingMappedBookerDto | null;
  bookingTransactionList: any[];
}

export class UpdateBookingBookerInfoDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  countryId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  countryNumber: string;

  @IsString()
  @IsOptional()
  gender?: string;
}

export class CalculateReservationAmenityInputDto {
  count?: number;

  code?: string;
}

export interface ReservationAmenityPricingDateDto {
  date: string;
  count: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
}

export class CalculateReservationPricingInputDto {
  index?: string;

  // ISO OffsetDateTime, ví dụ: 2024-01-01T12:00:00+07:00
  arrival: string;

  departure: string;

  amenityList?: CalculateReservationAmenityInputDto[];

  childrenAges?: number[];

  adults?: number;

  pets?: number;

  roomProductCode?: string;

  ratePlanCode?: string;

  roomProductId?: string;

  ratePlanId?: string;

  allocatedChildren?: number;

  allocatedAdults?: number;

  allocatedExtraChildren?: number;

  allocatedExtraAdults?: number;

  allocatedPets?: number;
}

export class CalculateBookingPricingInputDto {
  hotelCode?: string;

  hotelId?: string;

  translateTo?: LanguageCodeEnum;

  reservations: CalculateReservationPricingInputDto[];

  isCityTaxIncluded?: boolean;
  isSkipCancellationPolicy?: boolean;
  isSkipPaymentTerm?: boolean;
}

export class CityTaxBreakdownDto {
  id: string;
  code: string;
  name: string;
  amount: number;
  chargeMethod?: CityTaxChargeMethodEnum;
}

export class CalculatedCityTaxDto {
  propertyId?: string;
  fromDate?: string;
  toDate?: string;
  roomProductSalesPlanId?: string;
  taxBreakdown: CityTaxBreakdownDto[];
  totalCityTaxAmount?: number;
  chargeMethod?: CityTaxChargeMethodEnum;
}

export interface DailyRoomRateDto {
  date: string;
  baseAmount: number;
  taxAmount: number;
  grossAmount: number;
  baseAmountBeforeAdjustment: number;
  taxAmountBeforeAdjustment: number;
  grossAmountBeforeAdjustment: number;
}

export class HotelAmenityDto {
  id: string;
  code: string;
  name: string;
  description: string;
  amenityType: string;
  pricingUnit: string;
  includedDates?: string[];
  iconImageUrl: string;
  isIncluded?: boolean;
  isePricingDisplayMode?: IsePricingDisplayModeEnum;
}

export interface ReservationAmenityComboItemPricingDto {
  masterHotelAmenityId: string;
  hotelAmenity: HotelAmenity;
  totalSellingRate: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
}

export class AmenityPricingDto {
  isSalesPlanIncluded: boolean;
  hotelAmenity: HotelAmenityDto;
  ageCategoryPricingList: HotelAmenityAgeCategoryPricingDto[];
  count: number;
  totalSellingRate: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
  averageDailyRate: number;
  taxDetailsMap: Record<string, Decimal>;
  taxSettingList: HotelTaxSetting[];
  amenityPricingDateList: ReservationAmenityPricingDateDto[];
  comboItemPricingList: ReservationAmenityComboItemPricingDto[];
  cityTaxAmount?: number;
  extraServiceType?: string;
  includedDates?: string[];
  linkedAmenityInfoList?: HotelAmenity[];
  sellingType?: SellingTypeEnum;
}

export class RoomProductSalesPlanDto {
  id: string;
  rfcId: string;
  ratePlanId: string;
  name?: string;
  code: string;
  cancellationType?: string;
  guaranteeType?: string;
  totalBaseRate?: number;
  ratePlan: RatePlanDto;
  totalSellingRate: number;
  totalBaseAmount: number;
  totalBaseAmountBeforeAdjustment?: number;
  totalGrossAmount: number;
  totalGrossAmountBeforeAdjustment?: number;
  taxAmount: number;
  cityTaxAmount?: number;
  serviceChargeAmount: number;
  averageDailyRate: number;
  roomOnlySellingPrice?: number;
  adjustmentPercentage?: number;
  shouldShowStrikeThrough?: boolean;
  averageDailyRateWithTax?: number;
  averageDailyRateIncludingCityTax?: number;
  averageDailyRateWithoutTax?: number;
  strikeThroughTotalGrossAmount?: number;
  calculatedCityTax?: CalculatedCityTaxDto;
  roomTaxDetailsMap?: Record<string, number>;
  includedServiceTaxDetailsMap?: Record<string, Decimal>;
  // dailySellingRateList: DailySellingRateDto[];
  totalExtraBedAmount?: number;
  totalOccupancySurchargeAmount?: number;
  totalSellingRateBeforeAdjustment?: number;
  taxAmountBeforeAdjustment?: number;
  dailyRoomRateList: DailyRoomRateDto[];
  baseRate?: number;
}

export class RetailFeatureImageDto {
  imageUrl: string;
}

export class RetailCategoryDto {
  id: string;
  name: string;
  code: string;
  displaySequence: number;
}

export class RetailFeatureDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  quantity: number;
  retailFeatureImageList?: RetailFeatureImageDto[];
  hotelRetailCategory: RetailCategoryDto;
  measurementUnit: string;
}

export class StandardFeatureDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  iconImageUrl: string;
}

export class RoomProductDto {
  id: string;
  hotelId?: string;
  name: string;
  code: string;
  description: string;
  capacityAdult?: number;
  capacityChildren?: number;
  rfcImageList: any[];
  rfcType?: string;
  numberOfBedrooms: number;
  allocatedAdultCount?: number;
  allocatedChildCount?: number;
  allocatedExtraBedAdultCount?: number;
  allocatedExtraBedChildCount?: number;
  allocatedPetCount?: number;
  space: number;
  capacityDefault: number;
  maximumAdult: number;
  maximumKid: number;
  capacityExtra: number;
  extraBedAdult: number;
  extraBedKid: number;
  status: string;
  travelTag?: string;
  occasion?: string;
  retailFeatureList: RetailFeatureDto[];
  standardFeatureList: StandardFeatureDto[];
}

export class TaxDto {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  rate?: number;
  amount: number;
  description?: string;
}

export class HotelPaymentTermDto {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  description?: string;
  payAtHotel: number;
  payOnConfirmation: number;
  payAtHotelDescription: string;
  payOnConfirmationDescription: string;
}

export class HotelCancellationPolicyDto {
  id: string;
  name: string;
  description: string;
  hourPrior: number;
}

export class ReservationPricingDto {
  arrival: string;
  departure: string;
  adults: number;
  childrenAgeList: number[];
  index?: string;
  allocatedChildren: number;
  allocatedAdults: number;
  allocatedExtraChildren: number;
  allocatedExtraAdults: number;
  allocatedPets: number;
  roomProductSalesPlan: RoomProductSalesPlanDto;
  amenityPricingList: AmenityPricingDto[];
  roomProduct: RoomProductDto;
  averageDailyRate: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  cityTaxAmount: number;
  payOnConfirmationAmount: number;
  payAtHotelAmount: number;
  totalSellingRate: number;
  totalSellingRateBySetting: number;
  adrSubTotal: number;
  adrSubTotalBySetting: number;
  accommodationTaxAmount: number;
  accommodationTaxList: TaxDto[];
  extraServiceTaxAmount: number;
  extraServiceTaxList: TaxDto[];
  totalAccommodationAmount: number;
  totalAccommodationAmountBySetting: number;
  averageAccommodationAmount: number;
  hotelPaymentTerm: HotelPaymentTermDto;
  hotelCxlPolicy: HotelCancellationPolicyDto;
  calculatedCityTax?: CalculatedCityTaxDto;
  totalBaseAmountBeforeAdjustment?: number;
  totalGrossAmountBeforeAdjustment?: number;
  adjustmentPercentage?: number;
  shouldShowStrikeThrough?: boolean;
  taxDetailsMap: Record<string, any>;
  taxAccommodationDetailsMap: Record<string, any>;
  dailyRoomRateList?: DailyRoomRateDto[];
}

export class AvailableRoomCapacityFilterDto {
  hotelId: string;
  ids: string[];
  codes: string[];
  typeList?: RoomProductType[];
  status: RoomProductStatus;
  adult?: number;
  childrenAges?: number[];
  pets?: number;
}

export class HotelTaxDto {
  id?: string;
  hotelId?: string;
  name?: string;
  code?: string;
  rate?: number;
  amount?: number;
}

export class HotelCityTaxDto {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  rate: number;
}

export interface BookingPricingDto {
  hotelId: string; // UUID → string
  reservationPricingList: ReservationPricingDto[];
  totalGrossAmount: number;
  totalBaseAmount: number;
  averageDailyRate: number;
  taxAmount: number;
  currencyCode: string;
  payOnConfirmationAmount: number;
  payAtHotelAmount: number;
  totalSellingRate: number;
  totalSellingRateBySetting: number;
  cityTaxAmount: number;
  adrSubTotal: number;
  adrSubTotalBySetting: number;
  bookingAccommodationTaxAmount: number;
  bookingAccommodationTaxList: HotelTaxDto[];
  bookingExtraServiceTaxAmount: number;
  bookingExtraServiceTaxList: HotelTaxDto[];
  bookingTaxList: HotelTaxDto[];
  bookingCityTaxList: HotelCityTaxDto[];
  translateTo?: string;
}

export interface DailyRfcRatePlanExtraOccupancyRateFilter {
  fromDate: string;
  toDate: string;
  roomProductIds: string[];
  ratePlanIds: string[];
}

export class ExtraOccupancyRateDto {
  extraPeople: number;
  extraRate: number;
}

export class AmenityList {
  code: string;

  count: number;
}
export class ReservationDto {
  adults: number;

  allocatedAdults?: number;

  allocatedChildren?: number;

  allocatedExtraAdults?: number;

  allocatedExtraChildren?: number;

  amenityList?: AmenityList[];

  arrival: string;

  departure: string;

  childrenAgeList?: number[];

  index?: string;

  ratePlanId?: string;

  rfcId?: string;
  pets?: number;
}

export class CalculatePricingDto {
  hotelId: string;

  reservationList: ReservationDto[];
}
