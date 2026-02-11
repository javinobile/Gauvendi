export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigDecimal: { input: any; output: any; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
  Long: { input: any; output: any; }
  UUID: { input: any; output: any; }
}

export enum AmenityAvailabilityEnum {
  Daily = 'DAILY',
  OnlyOnArrival = 'ONLY_ON_ARRIVAL',
  OnlyOnDeparture = 'ONLY_ON_DEPARTURE'
}

export enum AmenityDistributionChannelEnum {
  GvSalesEngine = 'GV_SALES_ENGINE',
  GvVoice = 'GV_VOICE'
}

export interface AmenityReservation {
  ageCategory?: Maybe<HotelAgeCategory>;
  ageCategoryCode?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  totalPrice?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface AmenityReservationInput {
  ageCategoryCode?: InputMaybe<Scalars['String']['input']>;
  count?: InputMaybe<Scalars['Int']['input']>;
}

export enum AmenitySellingTypeEnum {
  Combo = 'COMBO',
  Single = 'SINGLE'
}

export enum AmenityStatusEnum {
  Available = 'AVAILABLE',
  UnAvailable = 'UN_AVAILABLE'
}

export enum AmenityTypeEnum {
  Amenity = 'AMENITY',
  ExtraBed = 'EXTRA_BED',
  MealPlan = 'MEAL_PLAN',
  Service = 'SERVICE'
}

export interface AvailablePaymentMethod {
  paymentMethodCode?: Maybe<HotelPaymentModeCodeEnum>;
  paymentMethodDescription?: Maybe<Scalars['String']['output']>;
  paymentMethodDetailsList?: Maybe<Array<Maybe<PaymentMethodDetails>>>;
  paymentMethodId?: Maybe<Scalars['UUID']['output']>;
  paymentMethodName?: Maybe<Scalars['String']['output']>;
}

export interface AvailablePaymentMethodFilter {
  arrival?: InputMaybe<Scalars['Date']['input']>;
  departure?: InputMaybe<Scalars['Date']['input']>;
  propertyCode?: InputMaybe<Scalars['String']['input']>;
  salesPlanCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface Booking {
  acceptTnc?: Maybe<Scalars['Boolean']['output']>;
  additionalGuest?: Maybe<Array<Maybe<Guest>>>;
  arrival?: Maybe<Scalars['DateTime']['output']>;
  averageDailyRate?: Maybe<Scalars['BigDecimal']['output']>;
  balance?: Maybe<Scalars['BigDecimal']['output']>;
  booker?: Maybe<Guest>;
  bookingAccommodationTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  bookingAccommodationTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  bookingCityTaxList?: Maybe<Array<Maybe<HotelCityTax>>>;
  bookingExtraServiceTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  bookingExtraServiceTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  bookingFlow?: Maybe<BookingFlow>;
  bookingLanguage?: Maybe<Scalars['String']['output']>;
  bookingMetadataList?: Maybe<Array<Maybe<BookingMetadata>>>;
  bookingNumber?: Maybe<Scalars['String']['output']>;
  bookingTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  bookingTransactionList?: Maybe<Array<Maybe<BookingTransaction>>>;
  cancelledBy?: Maybe<Scalars['String']['output']>;
  cancelledDate?: Maybe<Scalars['DateTime']['output']>;
  cancelledReason?: Maybe<Scalars['String']['output']>;
  childrenAgeList?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  cityTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  cityTaxList?: Maybe<Array<Maybe<HotelCityTax>>>;
  currency?: Maybe<Currency>;
  cxlPolicy?: Maybe<HotelCancellationPolicy>;
  cxlPolicyCode?: Maybe<Scalars['String']['output']>;
  departure?: Maybe<Scalars['DateTime']['output']>;
  exchangeRate?: Maybe<Scalars['BigDecimal']['output']>;
  feeList?: Maybe<Array<Maybe<Fee>>>;
  guaranteeType?: Maybe<Scalars['String']['output']>;
  guestList?: Maybe<Array<Maybe<Guest>>>;
  hotelPaymentModeCode?: Maybe<Scalars['String']['output']>;
  hourPrior?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  occasionList?: Maybe<Array<Maybe<HotelTag>>>;
  payAtHotelAmount?: Maybe<Scalars['BigDecimal']['output']>;
  payOnConfirmationAmount?: Maybe<Scalars['BigDecimal']['output']>;
  paymentTerm?: Maybe<HotelPaymentTerm>;
  paymentTermCode?: Maybe<Scalars['String']['output']>;
  promoCode?: Maybe<Scalars['String']['output']>;
  ratePlanDescription?: Maybe<Scalars['String']['output']>;
  ratePlanName?: Maybe<Scalars['String']['output']>;
  reservationList?: Maybe<Array<Maybe<Reservation>>>;
  serviceChargeAmount?: Maybe<Scalars['BigDecimal']['output']>;
  specialRequest?: Maybe<Scalars['String']['output']>;
  status?: Maybe<BookingStatusEnum>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalAdult?: Maybe<Scalars['Int']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalChildren?: Maybe<Scalars['Int']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
  travelTagList?: Maybe<Array<Maybe<HotelTag>>>;
  vatAmount?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface BookingFilter {
  /**  for cheat repush */
  hotelId?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  statusList?: InputMaybe<Array<InputMaybe<BookingStatusEnum>>>;
  tempId?: InputMaybe<Scalars['UUID']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export enum BookingFlow {
  CallProPlus = 'CALL_PRO_PLUS',
  Direct = 'DIRECT',
  LowestPrice = 'LOWEST_PRICE',
  Match = 'MATCH',
  MostPopular = 'MOST_POPULAR',
  Operator = 'OPERATOR',
  Other = 'OTHER',
  Recommended = 'RECOMMENDED',
  Voice = 'VOICE'
}

export interface BookingInformation {
  additionalGuest?: Maybe<Array<Maybe<Guest>>>;
  adrSubTotal?: Maybe<Scalars['BigDecimal']['output']>;
  adrSubTotalBySetting?: Maybe<Scalars['BigDecimal']['output']>;
  arrival?: Maybe<Scalars['Long']['output']>;
  averageDailyRate?: Maybe<Scalars['BigDecimal']['output']>;
  balance?: Maybe<Scalars['BigDecimal']['output']>;
  booker?: Maybe<Guest>;
  bookingCityTaxList?: Maybe<Array<Maybe<HotelCityTax>>>;
  bookingFlow?: Maybe<BookingFlow>;
  bookingNumber?: Maybe<Scalars['String']['output']>;
  bookingTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  cityTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  cityTaxList?: Maybe<Array<Maybe<HotelCityTax>>>;
  currency?: Maybe<Currency>;
  departure?: Maybe<Scalars['Long']['output']>;
  exchangeRate?: Maybe<Scalars['BigDecimal']['output']>;
  feeList?: Maybe<Array<Maybe<Fee>>>;
  guaranteeType?: Maybe<Scalars['String']['output']>;
  hotelPaymentTerm?: Maybe<HotelPaymentTerm>;
  id?: Maybe<Scalars['UUID']['output']>;
  payAtHotelAmount?: Maybe<Scalars['BigDecimal']['output']>;
  payOnConfirmationAmount?: Maybe<Scalars['BigDecimal']['output']>;
  reservationList?: Maybe<Array<Maybe<Reservation>>>;
  serviceChargeAmount?: Maybe<Scalars['BigDecimal']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  specialRequest?: Maybe<Scalars['String']['output']>;
  status?: Maybe<BookingStatusEnum>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRateBySetting?: Maybe<Scalars['BigDecimal']['output']>;
  vatAmount?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface BookingInformationInput {
  additionalGuestList?: InputMaybe<Array<InputMaybe<GuestInformationInput>>>;
  arrival?: InputMaybe<Scalars['BigDecimal']['input']>;
  arrivalDate?: InputMaybe<Scalars['Date']['input']>;
  booker?: InputMaybe<GuestInformationInput>;
  bookingFlow?: InputMaybe<BookingFlow>;
  channel?: InputMaybe<Scalars['String']['input']>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  departure?: InputMaybe<Scalars['BigDecimal']['input']>;
  departureDate?: InputMaybe<Scalars['Date']['input']>;
  guestInformation?: InputMaybe<GuestInformationInput>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelPaymentModeCode?: InputMaybe<HotelPaymentModeCodeEnum>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  paymentInformation?: InputMaybe<PaymentInfoInput>;
  reservationList?: InputMaybe<Array<InputMaybe<ReservationInput>>>;
  source?: InputMaybe<Scalars['String']['input']>;
  specialRequest?: InputMaybe<Scalars['String']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface BookingInput {
  acceptTnc?: InputMaybe<Scalars['Boolean']['input']>;
  additionalGuestList?: InputMaybe<Array<InputMaybe<PersonInput>>>;
  arrival?: InputMaybe<Scalars['DateTime']['input']>;
  booker?: InputMaybe<GuestInput>;
  bookingFlow?: InputMaybe<BookingFlow>;
  departure?: InputMaybe<Scalars['DateTime']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelPaymentModeCode?: InputMaybe<HotelPaymentModeCodeEnum>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  primaryGuest?: InputMaybe<PersonInput>;
  reservationList?: InputMaybe<Array<InputMaybe<ReservationInput>>>;
  source?: InputMaybe<Scalars['String']['input']>;
  specialRequest?: InputMaybe<Scalars['String']['input']>;
}

export interface BookingMetadata {
  bookingId?: Maybe<Scalars['String']['output']>;
  entity?: Maybe<Scalars['String']['output']>;
  hotelId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
}

export interface BookingPaymentAction {
  data?: Maybe<BookingPaymentActionData>;
  id?: Maybe<Scalars['String']['output']>;
  method?: Maybe<Scalars['String']['output']>;
  paymentData?: Maybe<Scalars['String']['output']>;
  paymentMethodId?: Maybe<Scalars['String']['output']>;
  paymentProviderCode?: Maybe<PaymentProviderCodeEnum>;
  type?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
}

export interface BookingPaymentActionData {
  MD?: Maybe<Scalars['String']['output']>;
  paReq?: Maybe<Scalars['String']['output']>;
  termUrl?: Maybe<Scalars['String']['output']>;
}

export interface BookingPaymentResponse {
  action?: Maybe<BookingPaymentAction>;
  booking?: Maybe<Booking>;
  bookingInformation?: Maybe<BookingInformation>;
  bookingTransaction?: Maybe<BookingTransaction>;
}

export interface BookingPricing {
  adrSubTotal?: Maybe<Scalars['BigDecimal']['output']>;
  adrSubTotalBySetting?: Maybe<Scalars['BigDecimal']['output']>;
  averageDailyRate?: Maybe<Scalars['BigDecimal']['output']>;
  bookingAccommodationTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  bookingAccommodationTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  bookingCityTaxList?: Maybe<Array<Maybe<HotelCityTax>>>;
  bookingExtraServiceTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  bookingExtraServiceTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  bookingTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  cityTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  currencyCode?: Maybe<Scalars['String']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  payAtHotelAmount?: Maybe<Scalars['BigDecimal']['output']>;
  payOnConfirmationAmount?: Maybe<Scalars['BigDecimal']['output']>;
  reservationPricingList?: Maybe<Array<Maybe<ReservationPricing>>>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRateBySetting?: Maybe<Scalars['BigDecimal']['output']>;
  translateTo?: Maybe<Scalars['String']['output']>;
}

export interface BookingRequest {
  arrival?: InputMaybe<Scalars['BigDecimal']['input']>;
  departure?: InputMaybe<Scalars['BigDecimal']['input']>;
  expectedFeatureCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  priorityCategoryCodeList?: InputMaybe<Array<InputMaybe<PriorityModel>>>;
  rfcRatePlanCode?: InputMaybe<Scalars['String']['input']>;
  roomRequestList?: InputMaybe<Array<InputMaybe<RoomRequest>>>;
  searchType?: InputMaybe<SearchTypeEnum>;
  selectedRfcIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  stayOptionCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  stayOptionTypeList?: InputMaybe<Array<InputMaybe<StayOptionTypeEnum>>>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export enum BookingStatusEnum {
  Cancelled = 'CANCELLED',
  CheckedIn = 'CHECKED_IN',
  CheckedOut = 'CHECKED_OUT',
  Completed = 'COMPLETED',
  Confirmed = 'CONFIRMED',
  Proposed = 'PROPOSED',
  Released = 'RELEASED',
  Reserved = 'RESERVED'
}

export interface BookingStatusFilter {
  bookingId: Scalars['UUID']['input'];
  paymentReferenceId?: InputMaybe<Scalars['String']['input']>;
}

export interface BookingTransaction {
  accountHolder?: Maybe<Scalars['String']['output']>;
  accountNumber?: Maybe<Scalars['String']['output']>;
  cardType?: Maybe<Scalars['String']['output']>;
  currency?: Maybe<Currency>;
  expiryMonth?: Maybe<Scalars['String']['output']>;
  expiryYear?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  status?: Maybe<BookingTransactionStatusEnum>;
  totalAmount?: Maybe<Scalars['BigDecimal']['output']>;
  transactionNumber?: Maybe<Scalars['String']['output']>;
}

export enum BookingTransactionStatusEnum {
  PaymentFailed = 'PAYMENT_FAILED',
  PaymentSucceeded = 'PAYMENT_SUCCEEDED',
  PendingPayment = 'PENDING_PAYMENT'
}

export interface Brand {
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export interface BrowserInfo {
  acceptHeader?: InputMaybe<Scalars['String']['input']>;
  colorDepth?: InputMaybe<Scalars['Int']['input']>;
  javaEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  screenHeight?: InputMaybe<Scalars['Int']['input']>;
  screenWidth?: InputMaybe<Scalars['Int']['input']>;
  timeZoneOffset?: InputMaybe<Scalars['Int']['input']>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
}

export interface BundleSalesPlanFilter {
  adults?: InputMaybe<Scalars['Int']['input']>;
  arrival: Scalars['DateTime']['input'];
  childrenAgeList?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  departure: Scalars['DateTime']['input'];
  pets?: InputMaybe<Scalars['Int']['input']>;
  propertyCode?: InputMaybe<Scalars['String']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface CalculateBookingPricingInput {
  propertyCode?: InputMaybe<Scalars['String']['input']>;
  reservationList?: InputMaybe<Array<InputMaybe<CalculateReservationPricingInput>>>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface CalculateReservationAmenityInput {
  code?: InputMaybe<Scalars['String']['input']>;
  count?: InputMaybe<Scalars['Int']['input']>;
}

export interface CalculateReservationPricingInput {
  adults?: InputMaybe<Scalars['Int']['input']>;
  allocatedAdults?: InputMaybe<Scalars['Int']['input']>;
  allocatedChildren?: InputMaybe<Scalars['Int']['input']>;
  allocatedExtraAdults?: InputMaybe<Scalars['Int']['input']>;
  allocatedExtraChildren?: InputMaybe<Scalars['Int']['input']>;
  amenityList?: InputMaybe<Array<InputMaybe<CalculateReservationAmenityInput>>>;
  arrival?: InputMaybe<Scalars['DateTime']['input']>;
  childrenAgeList?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  departure?: InputMaybe<Scalars['DateTime']['input']>;
  index?: InputMaybe<Scalars['String']['input']>;
  pets?: InputMaybe<Scalars['Int']['input']>;
  roomProductCode?: InputMaybe<Scalars['String']['input']>;
  salesPlanCode?: InputMaybe<Scalars['String']['input']>;
}

export interface CalculatedCityTax {
  amount?: Maybe<Scalars['BigDecimal']['output']>;
  fromDate?: Maybe<Scalars['Date']['output']>;
  propertyId?: Maybe<Scalars['UUID']['output']>;
  roomProductSalesPlanId?: Maybe<Scalars['UUID']['output']>;
  taxBreakdown?: Maybe<Array<Maybe<CalculatedCityTaxBreakdown>>>;
  toDate?: Maybe<Scalars['Date']['output']>;
}

export interface CalculatedCityTaxBreakdown {
  amount?: Maybe<Scalars['BigDecimal']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export interface CalendarDailyPriceOption {
  grossPrice?: Maybe<Scalars['BigDecimal']['output']>;
  label?: Maybe<CalendarPriceOptionLabel>;
  netPrice?: Maybe<Scalars['BigDecimal']['output']>;
  price?: Maybe<Scalars['BigDecimal']['output']>;
  restrictionList?: Maybe<Array<Maybe<CalendarDailyRestriction>>>;
  roomOnlyPrice?: Maybe<Scalars['BigDecimal']['output']>;
  roomProductId?: Maybe<Scalars['UUID']['output']>;
  salesPlanId?: Maybe<Scalars['UUID']['output']>;
  status?: Maybe<CalendarPriceOptionStatus>;
}

export interface CalendarDailyRate {
  date?: Maybe<Scalars['Date']['output']>;
  priceOptionList?: Maybe<Array<Maybe<CalendarDailyPriceOption>>>;
}

export interface CalendarDailyRateFilter {
  childAgeList?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  dedicatedProductCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromDate?: InputMaybe<Scalars['Date']['input']>;
  isDealOptionIncluded?: InputMaybe<Scalars['Boolean']['input']>;
  pets?: InputMaybe<Scalars['Int']['input']>;
  productFeatureCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  promoCode?: InputMaybe<Scalars['String']['input']>;
  propertyCode?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['Date']['input']>;
  totalAdult?: InputMaybe<Scalars['Int']['input']>;
}

export interface CalendarDailyRestriction {
  restrictionCode?: Maybe<RestrictionCodeEnum>;
  restrictionValue?: Maybe<Scalars['String']['output']>;
}

export enum CalendarPriceOptionLabel {
  Deal = 'DEAL',
  Default = 'DEFAULT'
}

export enum CalendarPriceOptionStatus {
  CapacityOver = 'CAPACITY_OVER',
  CheckInUnavailable = 'CHECK_IN_UNAVAILABLE',
  Default = 'DEFAULT'
}

export interface CalendarRateFilter {
  adults?: InputMaybe<Scalars['Int']['input']>;
  arrival: Scalars['DateTime']['input'];
  childrenAgeList?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  departure: Scalars['DateTime']['input'];
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  promoCode?: InputMaybe<Scalars['String']['input']>;
}

export enum CancellationFeeUnitEnum {
  FixAmount = 'FIX_AMOUNT',
  Night = 'NIGHT',
  Percentage = 'PERCENTAGE'
}

export enum CancellationPolicyDisplayUnitEnum {
  Day = 'DAY',
  Hour = 'HOUR'
}

export enum CancellationTypeEnum {
  Flexible = 'FLEXIBLE',
  NonRefundable = 'NON_REFUNDABLE'
}

export enum CategoryTypeEnum {
  MultipleOption = 'MULTIPLE_OPTION',
  OneOption = 'ONE_OPTION'
}

export interface Company {
  address?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  postalCode?: Maybe<Scalars['String']['output']>;
  taxId?: Maybe<Scalars['String']['output']>;
}

export interface CompleteBookingInput {
  booking?: InputMaybe<BookingInput>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  paymentInput?: InputMaybe<PaymentInput>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface ConfirmBookingInput {
  booking?: InputMaybe<BookingInput>;
  creditCardInformation?: InputMaybe<CreditCardInformationInput>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelPaymentAccountType?: InputMaybe<HotelPaymentAccountTypeEnum>;
  occasionCodeList?: InputMaybe<Scalars['String']['input']>;
  priorityCategoryCodeList?: InputMaybe<Array<InputMaybe<PriorityModel>>>;
  promoCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  travelTagCodeList?: InputMaybe<Scalars['String']['input']>;
}

export interface ConfirmBookingPaymentInput {
  bookingId: Scalars['UUID']['input'];
  propertyCode: Scalars['String']['input'];
  refPaymentId: Scalars['String']['input'];
}

export interface ConfirmBookingProposalInput {
  booking?: InputMaybe<BookingInput>;
  bookingPageUrl?: InputMaybe<Scalars['String']['input']>;
  browserAgentIp?: InputMaybe<Scalars['String']['input']>;
  browserInfo?: InputMaybe<BrowserInfo>;
  creditCardInformation?: InputMaybe<CreditCardInformationInput>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelPaymentAccountType?: InputMaybe<HotelPaymentAccountTypeEnum>;
  origin?: InputMaybe<Scalars['String']['input']>;
  paymentProviderCode?: InputMaybe<PaymentProviderCodeEnum>;
  priorityCategoryCodeList?: InputMaybe<Array<InputMaybe<PriorityModel>>>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface ConfirmBookingResponse {
  action?: Maybe<BookingPaymentAction>;
  booking?: Maybe<Booking>;
}

export interface Country {
  code?: Maybe<Scalars['String']['output']>;
  flagImageUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  phoneCode?: Maybe<Scalars['String']['output']>;
  translationList?: Maybe<Array<Maybe<CountryTranslation>>>;
}

export enum CountryExpandEnum {
  Translation = 'translation'
}

export interface CountryFilter {
  codeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  expand?: InputMaybe<Array<InputMaybe<CountryExpandEnum>>>;
  idList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface CountryTranslation {
  countryId?: Maybe<Scalars['UUID']['output']>;
  languageCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export interface CppBookingSummaryFilter {
  bookingId?: InputMaybe<Scalars['UUID']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface CreditCardInformationInput {
  cardHolder?: InputMaybe<Scalars['String']['input']>;
  cardNumber?: InputMaybe<Scalars['String']['input']>;
  cvv?: InputMaybe<Scalars['String']['input']>;
  expiryMonth?: InputMaybe<Scalars['String']['input']>;
  expiryYear?: InputMaybe<Scalars['String']['input']>;
  refPaymentMethodId?: InputMaybe<Scalars['String']['input']>;
  transactionId?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
}

export interface Currency {
  code?: Maybe<Scalars['String']['output']>;
  currencyRateList?: Maybe<Array<Maybe<CurrencyRate>>>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export interface CurrencyRate {
  baseCurrency?: Maybe<Currency>;
  exchangeCurrency?: Maybe<Currency>;
  rate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface DailyRate {
  date?: Maybe<Scalars['Date']['output']>;
  hotelRestrictionList?: Maybe<Array<Maybe<HotelRestriction>>>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface DailySellingRate {
  date?: Maybe<Scalars['Date']['output']>;
  rfcRatePlanId?: Maybe<Scalars['UUID']['output']>;
  sellingRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export enum DayOfWeek {
  Friday = 'FRIDAY',
  Monday = 'MONDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
  Thursday = 'THURSDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY'
}

export interface DeclineProposalBookingInput {
  bookingId?: InputMaybe<Scalars['UUID']['input']>;
  cancelledBy?: InputMaybe<Scalars['String']['input']>;
  cancelledReason?: InputMaybe<Scalars['String']['input']>;
}

export interface Fee {
  feeType?: Maybe<FeeTypeEnum>;
  feeValue?: Maybe<Scalars['BigDecimal']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  totalAmount?: Maybe<Scalars['BigDecimal']['output']>;
}

export enum FeeTypeEnum {
  FixedValue = 'FIXED_VALUE',
  NetValue = 'NET_VALUE'
}

export interface FileLibrary {
  id?: Maybe<Scalars['UUID']['output']>;
  url?: Maybe<Scalars['String']['output']>;
}

export interface FontWeightDetails {
  contentType?: Maybe<Scalars['String']['output']>;
  originalName?: Maybe<Scalars['String']['output']>;
  type?: Maybe<FontWeightDetailsTypeEnum>;
  url?: Maybe<Scalars['String']['output']>;
}

export enum FontWeightDetailsTypeEnum {
  FontWeight_300 = 'FONT_WEIGHT_300',
  FontWeight_400 = 'FONT_WEIGHT_400',
  FontWeight_500 = 'FONT_WEIGHT_500',
  FontWeight_600 = 'FONT_WEIGHT_600',
  FontWeight_700 = 'FONT_WEIGHT_700'
}

export interface GenerateTransactionInput {
  amount?: InputMaybe<Scalars['BigDecimal']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
}

export interface GlobalPaymentMethod {
  code?: Maybe<HotelPaymentModeCodeEnum>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  paymentProviderList?: Maybe<Array<Maybe<GlobalPaymentProvider>>>;
  propertyPaymentMethodSetting?: Maybe<PropertyPaymentMethodSetting>;
  supportedPaymentProviderCodeList?: Maybe<Array<Maybe<PaymentProviderCodeEnum>>>;
}

export interface GlobalPaymentProvider {
  code?: Maybe<PaymentProviderCodeEnum>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export enum GuaranteeTypeEnum {
  Company = 'COMPANY',
  CreditCard = 'CREDIT_CARD',
  Prepayment = 'PREPAYMENT',
  SixPmHold = 'SIX_PM_HOLD'
}

export interface Guest {
  address?: Maybe<Scalars['String']['output']>;
  age?: Maybe<Scalars['Int']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  companyAddress?: Maybe<Scalars['String']['output']>;
  companyCity?: Maybe<Scalars['String']['output']>;
  companyCountry?: Maybe<Scalars['String']['output']>;
  companyEmail?: Maybe<Scalars['String']['output']>;
  companyName?: Maybe<Scalars['String']['output']>;
  companyPostalCode?: Maybe<Scalars['String']['output']>;
  companyTaxId?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Country>;
  countryId?: Maybe<Scalars['UUID']['output']>;
  countryNumber?: Maybe<Scalars['String']['output']>;
  emailAddress?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  isAdult?: Maybe<Scalars['Boolean']['output']>;
  isBooker?: Maybe<Scalars['Boolean']['output']>;
  isMainGuest?: Maybe<Scalars['Boolean']['output']>;
  isReturningGuest?: Maybe<Scalars['Boolean']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  postalCode?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
}

export interface GuestInformationInput {
  address?: InputMaybe<Scalars['String']['input']>;
  age?: InputMaybe<Scalars['Int']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  companyAddress?: InputMaybe<Scalars['String']['input']>;
  companyCity?: InputMaybe<Scalars['String']['input']>;
  companyCountry?: InputMaybe<Scalars['String']['input']>;
  companyEmail?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  companyPostalCode?: InputMaybe<Scalars['String']['input']>;
  companyTaxId?: InputMaybe<Scalars['String']['input']>;
  countryId?: InputMaybe<Scalars['UUID']['input']>;
  emailAddress?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  isAdult?: InputMaybe<Scalars['Boolean']['input']>;
  isBooker?: InputMaybe<Scalars['Boolean']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phoneInfo?: InputMaybe<PhoneInfoInput>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  reservationIdx?: InputMaybe<Scalars['Int']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
}

export interface GuestInput {
  address?: InputMaybe<Scalars['String']['input']>;
  age?: InputMaybe<Scalars['Int']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  companyAddress?: InputMaybe<Scalars['String']['input']>;
  companyCity?: InputMaybe<Scalars['String']['input']>;
  companyCountry?: InputMaybe<Scalars['String']['input']>;
  companyEmail?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  companyPostalCode?: InputMaybe<Scalars['String']['input']>;
  companyTaxId?: InputMaybe<Scalars['String']['input']>;
  countryId?: InputMaybe<Scalars['UUID']['input']>;
  countryNumber?: InputMaybe<Scalars['String']['input']>;
  emailAddress?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  isAdult?: InputMaybe<Scalars['Boolean']['input']>;
  isBooker?: InputMaybe<Scalars['Boolean']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  phoneInfo?: InputMaybe<PhoneInfoInput>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
}

export interface Hotel {
  address?: Maybe<Scalars['String']['output']>;
  addressDisplay?: Maybe<Scalars['String']['output']>;
  backgroundCategoryImageUrl?: Maybe<Scalars['String']['output']>;
  baseCurrency?: Maybe<Currency>;
  brand?: Maybe<Brand>;
  city?: Maybe<Scalars['String']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Country>;
  customThemeImageUrl?: Maybe<Scalars['String']['output']>;
  customizeStayOptionBackgroundImageUrl?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  emailAddressList?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  hotelConfigurationList?: Maybe<Array<Maybe<HotelConfiguration>>>;
  hotelPaymentModeList?: Maybe<Array<Maybe<HotelPaymentMode>>>;
  iconImageUrl?: Maybe<Scalars['String']['output']>;
  iconSymbolUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  isCityTaxIncludedSellingPrice?: Maybe<Scalars['Boolean']['output']>;
  latitude?: Maybe<Scalars['String']['output']>;
  longitude?: Maybe<Scalars['String']['output']>;
  lowestPriceImageUrl?: Maybe<Scalars['String']['output']>;
  measureMetric?: Maybe<MeasureMetricEnum>;
  name?: Maybe<Scalars['String']['output']>;
  organisation?: Maybe<Organisation>;
  paymentAccount?: Maybe<HotelPaymentAccount>;
  /**     phone                                           : String @deprecated(reason: "use phoneCode and phoneNumber instead") */
  phoneCode?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  postalCode?: Maybe<Scalars['String']['output']>;
  serviceChargeSetting?: Maybe<HotelServiceChargeSettingEnum>;
  signature?: Maybe<Scalars['String']['output']>;
  signatureBackgroundImageUrl?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  stayOptionBackgroundImageUrl?: Maybe<Scalars['String']['output']>;
  stayOptionSuggestionImageUrl?: Maybe<Scalars['String']['output']>;
  taxSetting?: Maybe<HotelTaxSettingEnum>;
  timeZone?: Maybe<Scalars['String']['output']>;
}

export interface HotelAgeCategory {
  code?: Maybe<Scalars['String']['output']>;
  fromAge?: Maybe<Scalars['Int']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  toAge?: Maybe<Scalars['Int']['output']>;
}

export interface HotelAmenity {
  amenityReservationList?: Maybe<Array<Maybe<AmenityReservation>>>;
  amenityType?: Maybe<AmenityTypeEnum>;
  baseRate?: Maybe<Scalars['BigDecimal']['output']>;
  calculatedRateList?: Maybe<Array<Maybe<HotelAmenityRate>>>;
  code?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displaySequence?: Maybe<Scalars['Int']['output']>;
  hotelAmenityPriceList?: Maybe<Array<Maybe<HotelAmenityPrice>>>;
  iconImageUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  includedDates?: Maybe<Array<Maybe<Scalars['Date']['output']>>>;
  isIncluded?: Maybe<Scalars['Boolean']['output']>;
  isePricingDisplayMode?: Maybe<HotelAmenityIsePricingDisplayMode>;
  linkedAmenityList?: Maybe<Array<Maybe<LinkedAmenityDto>>>;
  name?: Maybe<Scalars['String']['output']>;
  postNextDay?: Maybe<Scalars['Boolean']['output']>;
  pricingUnit?: Maybe<PricingUnitEnum>;
  sellingType?: Maybe<AmenitySellingTypeEnum>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  templateAmenity?: Maybe<TemplateAmenity>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface HotelAmenityFilter {
  amenityCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  amenityType?: InputMaybe<AmenityTypeEnum>;
  arrivalDate?: InputMaybe<Scalars['Date']['input']>;
  departureDate?: InputMaybe<Scalars['Date']['input']>;
  distributionChannelList?: InputMaybe<Array<InputMaybe<AmenityDistributionChannelEnum>>>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromTime?: InputMaybe<Scalars['String']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  idList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  isIncluded?: InputMaybe<Scalars['Boolean']['input']>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  roomProductCode?: InputMaybe<Scalars['String']['input']>;
  roomRequestList?: InputMaybe<Array<InputMaybe<RoomRequest>>>;
  salesPlanCode?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<AmenityStatusEnum>;
  toTime?: InputMaybe<Scalars['String']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface HotelAmenityInput {
  amenityReservationList?: InputMaybe<Array<InputMaybe<AmenityReservationInput>>>;
  code?: InputMaybe<Scalars['String']['input']>;
  count?: InputMaybe<Scalars['Int']['input']>;
}

export enum HotelAmenityIsePricingDisplayMode {
  Excluded = 'EXCLUDED',
  Included = 'INCLUDED'
}

export interface HotelAmenityPrice {
  hotelAgeCategory?: Maybe<HotelAgeCategory>;
  hotelAgeCategoryId?: Maybe<Scalars['UUID']['output']>;
  hotelAmenityId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  price?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface HotelAmenityRate {
  amenityRate?: Maybe<Scalars['BigDecimal']['output']>;
  dateOfRate?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  status?: Maybe<AmenityStatusEnum>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface HotelAmenityRateFilter {
  amenityCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromTime?: InputMaybe<Scalars['String']['input']>;
  hotelAmenityIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<AmenityStatusEnum>;
  toTime?: InputMaybe<Scalars['String']['input']>;
}

export interface HotelCancellationPolicy {
  cancellationFeeValue?: Maybe<Scalars['Float']['output']>;
  cancellationType?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displayUnit?: Maybe<HotelCancellationPolicyDisplayUnitEnum>;
  hourPrior?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  mappingCancellationPolicyCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export enum HotelCancellationPolicyDisplayUnitEnum {
  Day = 'DAY',
  Hour = 'HOUR'
}

export interface HotelCityTax {
  ageGroupList?: Maybe<Array<Maybe<HotelCityTaxAgeGroup>>>;
  amount?: Maybe<Scalars['BigDecimal']['output']>;
  chargeMethod?: Maybe<HotelCityTaxChargeMethodEnum>;
  cityTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  mappingCityTaxCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  status?: Maybe<HotelCityTaxStatusEnum>;
  translationList?: Maybe<Array<Maybe<HotelCityTaxTranslation>>>;
  unit?: Maybe<HotelCityTaxUnitEnum>;
  validFrom?: Maybe<Scalars['Date']['output']>;
  validTo?: Maybe<Scalars['Date']['output']>;
  value?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface HotelCityTaxAgeGroup {
  fromAge?: Maybe<Scalars['Int']['output']>;
  hotelCityTaxId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  propertyId?: Maybe<Scalars['UUID']['output']>;
  toAge?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['BigDecimal']['output']>;
}

export enum HotelCityTaxChargeMethodEnum {
  PayAtHotel = 'PAY_AT_HOTEL',
  PayOnConfirmation = 'PAY_ON_CONFIRMATION'
}

export enum HotelCityTaxStatusEnum {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export interface HotelCityTaxTranslation {
  description?: Maybe<Scalars['String']['output']>;
  hotelCityTaxId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  languageCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export enum HotelCityTaxUnitEnum {
  FixedOnGrossAmountRoom = 'FIXED_ON_GROSS_AMOUNT_ROOM',
  PercentageOnGrossAmountRoom = 'PERCENTAGE_ON_GROSS_AMOUNT_ROOM',
  PercentageOnNetAmountRoom = 'PERCENTAGE_ON_NET_AMOUNT_ROOM',
  PerPersonPerNight = 'PER_PERSON_PER_NIGHT',
  PerPersonPerStayFixed = 'PER_PERSON_PER_STAY_FIXED',
  PerPersonPerStayPercentage = 'PER_PERSON_PER_STAY_PERCENTAGE'
}

export interface HotelConfiguration {
  configType?: Maybe<Scalars['String']['output']>;
  configValue?: Maybe<HotelConfigurationDetail>;
  id?: Maybe<Scalars['UUID']['output']>;
}

export enum HotelConfigurationConfigTypeEnum {
  AutomationRestrictionMaxLos = 'AUTOMATION_RESTRICTION_MAX_LOS',
  AvailableRfcDisplay = 'AVAILABLE_RFC_DISPLAY',
  BorderColor = 'BORDER_COLOR',
  BrandingMarketing = 'BRANDING_MARKETING',
  ButtonBackgroundColor = 'BUTTON_BACKGROUND_COLOR',
  ButtonTextColor = 'BUTTON_TEXT_COLOR',
  CancellationPolicy = 'CANCELLATION_POLICY',
  ChildrenBookingAllowed = 'CHILDREN_BOOKING_ALLOWED',
  ChildrenPolicy = 'CHILDREN_POLICY',
  ColorAccent_1 = 'COLOR_ACCENT_1',
  ColorAccent_2 = 'COLOR_ACCENT_2',
  ColorAccent_3 = 'COLOR_ACCENT_3',
  ColorAccent_4 = 'COLOR_ACCENT_4',
  ColorAccent_5 = 'COLOR_ACCENT_5',
  ColorBackground_1 = 'COLOR_BACKGROUND_1',
  ColorBackground_2 = 'COLOR_BACKGROUND_2',
  ColorBackgroundSpecific = 'COLOR_BACKGROUND_SPECIFIC',
  ColorBookingSummaryBackground = 'COLOR_BOOKING_SUMMARY_BACKGROUND',
  ColorBorder = 'COLOR_BORDER',
  ColorBtnAddServicesBackground = 'COLOR_BTN_ADD_SERVICES_BACKGROUND',
  ColorBtnAddServiceText = 'COLOR_BTN_ADD_SERVICE_TEXT',
  ColorBtnRemoveServicesBackground = 'COLOR_BTN_REMOVE_SERVICES_BACKGROUND',
  ColorButtonBackground = 'COLOR_BUTTON_BACKGROUND',
  ColorButtonText = 'COLOR_BUTTON_TEXT',
  ColorCalendarMobileBackground = 'COLOR_CALENDAR_MOBILE_BACKGROUND',
  ColorDialogSelectCategoryBackground = 'COLOR_DIALOG_SELECT_CATEGORY_BACKGROUND',
  ColorDialogSelectFeatureBackground = 'COLOR_DIALOG_SELECT_FEATURE_BACKGROUND',
  ColorError = 'COLOR_ERROR',
  ColorExtraDetailBackground = 'COLOR_EXTRA_DETAIL_BACKGROUND',
  ColorExtraHeaderBackground = 'COLOR_EXTRA_HEADER_BACKGROUND',
  ColorExtraServicesItemBackground = 'COLOR_EXTRA_SERVICES_ITEM_BACKGROUND',
  ColorFeatureMatched = 'COLOR_FEATURE_MATCHED',
  ColorFeatureTagBackground = 'COLOR_FEATURE_TAG_BACKGROUND',
  ColorFeatureUnmatched = 'COLOR_FEATURE_UNMATCHED',
  ColorFilterOverlayBackground = 'COLOR_FILTER_OVERLAY_BACKGROUND',
  ColorFooterBackground = 'COLOR_FOOTER_BACKGROUND',
  ColorFooterText = 'COLOR_FOOTER_TEXT',
  ColorGuestInformationBackground = 'COLOR_GUEST_INFORMATION_BACKGROUND',
  ColorLogoBackground = 'COLOR_LOGO_BACKGROUND',
  ColorMainBackground = 'COLOR_MAIN_BACKGROUND',
  ColorNavigationBackground = 'COLOR_NAVIGATION_BACKGROUND',
  ColorNavigationIcon = 'COLOR_NAVIGATION_ICON',
  ColorNavigationIndicator = 'COLOR_NAVIGATION_INDICATOR',
  ColorNavigationItemText = 'COLOR_NAVIGATION_ITEM_TEXT',
  ColorNavigationItemTextActive = 'COLOR_NAVIGATION_ITEM_TEXT_ACTIVE',
  ColorNavigationLineIndicator = 'COLOR_NAVIGATION_LINE_INDICATOR',
  ColorPaymentDetailBackground = 'COLOR_PAYMENT_DETAIL_BACKGROUND',
  ColorPaymentInformationBackground = 'COLOR_PAYMENT_INFORMATION_BACKGROUND',
  ColorPaymentPolicyBackground = 'COLOR_PAYMENT_POLICY_BACKGROUND',
  ColorPaymentResultBackground = 'COLOR_PAYMENT_RESULT_BACKGROUND',
  ColorPaymentResultItemEvenBackground = 'COLOR_PAYMENT_RESULT_ITEM_EVEN_BACKGROUND',
  ColorPaymentResultItemOddBackground = 'COLOR_PAYMENT_RESULT_ITEM_ODD_BACKGROUND',
  ColorPaymentResultSubText = 'COLOR_PAYMENT_RESULT_SUB_TEXT',
  ColorPaymentResultText = 'COLOR_PAYMENT_RESULT_TEXT',
  ColorPaymentResultTitleBackground = 'COLOR_PAYMENT_RESULT_TITLE_BACKGROUND',
  ColorPaymentResultTotalBackground = 'COLOR_PAYMENT_RESULT_TOTAL_BACKGROUND',
  ColorPrice = 'COLOR_PRICE',
  ColorPrimary = 'COLOR_PRIMARY',
  ColorRatePlanBackground = 'COLOR_RATE_PLAN_BACKGROUND',
  ColorRatePlanBackgroundAfter = 'COLOR_RATE_PLAN_BACKGROUND_AFTER',
  ColorRatePlanItemBackground = 'COLOR_RATE_PLAN_ITEM_BACKGROUND',
  ColorRatePlanPanelBackground = 'COLOR_RATE_PLAN_PANEL_BACKGROUND',
  ColorRatePlanPanelText = 'COLOR_RATE_PLAN_PANEL_TEXT',
  ColorRatePlanText = 'COLOR_RATE_PLAN_TEXT',
  ColorRoomDetailBackground = 'COLOR_ROOM_DETAIL_BACKGROUND',
  ColorRoomLockRestriction = 'COLOR_ROOM_LOCK_RESTRICTION',
  ColorSearchBarBackground = 'COLOR_SEARCH_BAR_BACKGROUND',
  ColorSearchBarIcon = 'COLOR_SEARCH_BAR_ICON',
  ColorSearchBarSectionBackground = 'COLOR_SEARCH_BAR_SECTION_BACKGROUND',
  ColorSearchBarTitle = 'COLOR_SEARCH_BAR_TITLE',
  ColorSearchBarValue = 'COLOR_SEARCH_BAR_VALUE',
  ColorSearchFeatureBackgroundSelected = 'COLOR_SEARCH_FEATURE_BACKGROUND_SELECTED',
  ColorSearchFeatureBorder = 'COLOR_SEARCH_FEATURE_BORDER',
  ColorSearchFeatureIcon = 'COLOR_SEARCH_FEATURE_ICON',
  ColorSearchFeatureIconSelected = 'COLOR_SEARCH_FEATURE_ICON_SELECTED',
  ColorSearchFeatureText = 'COLOR_SEARCH_FEATURE_TEXT',
  ColorSearchFeatureTextSelected = 'COLOR_SEARCH_FEATURE_TEXT_SELECTED',
  ColorSecondary_1 = 'COLOR_SECONDARY_1',
  ColorSecondary_2 = 'COLOR_SECONDARY_2',
  ColorSecondary_3 = 'COLOR_SECONDARY_3',
  ColorServicesAddedBackground = 'COLOR_SERVICES_ADDED_BACKGROUND',
  ColorSubText = 'COLOR_SUB_TEXT',
  ColorSuccess = 'COLOR_SUCCESS',
  ColorSuggestionFeatureItemBackground = 'COLOR_SUGGESTION_FEATURE_ITEM_BACKGROUND',
  ColorSuggestionItemBackground = 'COLOR_SUGGESTION_ITEM_BACKGROUND',
  ColorTabInkRoomDetail = 'COLOR_TAB_INK_ROOM_DETAIL',
  ColorTabRoomDetailBackground = 'COLOR_TAB_ROOM_DETAIL_BACKGROUND',
  ColorText = 'COLOR_TEXT',
  ColorTextSpecific = 'COLOR_TEXT_SPECIFIC',
  ColorWarning = 'COLOR_WARNING',
  CookiebotConfiguration = 'COOKIEBOT_CONFIGURATION',
  CppViewMode = 'CPP_VIEW_MODE',
  CustomThemeBackground = 'CUSTOM_THEME_BACKGROUND',
  DefaultBookingRoomStatus = 'DEFAULT_BOOKING_ROOM_STATUS',
  DefaultLanguage = 'DEFAULT_LANGUAGE',
  DefaultPax = 'DEFAULT_PAX',
  DefaultStayNight = 'DEFAULT_STAY_NIGHT',
  DisableStayOptionPriceClustering = 'DISABLE_STAY_OPTION_PRICE_CLUSTERING',
  DockWcag = 'DOCK_WCAG',
  DuettoConfiguration = 'DUETTO_CONFIGURATION',
  FaviconImageUrl = 'FAVICON_IMAGE_URL',
  FontFamilyPrimary = 'FONT_FAMILY_PRIMARY',
  GauvendiLogoFooter = 'GAUVENDI_LOGO_FOOTER',
  GoogleAnalytics = 'GOOGLE_ANALYTICS',
  Gtm = 'GTM',
  ImpressumUrl = 'IMPRESSUM_URL',
  IseCalendarAdditionalInformationDisplay = 'ISE_CALENDAR_ADDITIONAL_INFORMATION_DISPLAY',
  IsePricingDisplay = 'ISE_PRICING_DISPLAY',
  IseUrl = 'ISE_URL',
  LastOpeningAvailabilityDate = 'LAST_OPENING_AVAILABILITY_DATE',
  LayoutSetting = 'LAYOUT_SETTING',
  LogoUrl = 'LOGO_URL',
  MandatoryGuestInput = 'MANDATORY_GUEST_INPUT',
  NavigationBackgroundColor = 'NAVIGATION_BACKGROUND_COLOR',
  NavigationItemColor = 'NAVIGATION_ITEM_COLOR',
  NavigationItemTextColor = 'NAVIGATION_ITEM_TEXT_COLOR',
  PenaltyScore = 'PENALTY_SCORE',
  PerAllowanceSetting = 'PER_ALLOWANCE_SETTING',
  PetPolicy = 'PET_POLICY',
  PricingDecimalRoundingRule = 'PRICING_DECIMAL_ROUNDING_RULE',
  PrimaryColor = 'PRIMARY_COLOR',
  PriorityWeight = 'PRIORITY_WEIGHT',
  PriorDaysTriggerUpdateBookingRoomStatus = 'PRIOR_DAYS_TRIGGER_UPDATE_BOOKING_ROOM_STATUS',
  PrivacyStatementUrl = 'PRIVACY_STATEMENT_URL',
  PropertyBranding = 'PROPERTY_BRANDING',
  ReceptionOperationClosing = 'RECEPTION_OPERATION_CLOSING',
  ReceptionOperationClosingPmsSync = 'RECEPTION_OPERATION_CLOSING_PMS_SYNC',
  RetailCategoryBackground = 'RETAIL_CATEGORY_BACKGROUND',
  RoomProductRecommendationConfiguratorSetting = 'ROOM_PRODUCT_RECOMMENDATION_CONFIGURATOR_SETTING',
  RoomProductRecommendationDirectSetting = 'ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING',
  RoomProductRecommendationGradedLabelSetting = 'ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING',
  RoomProductRestrictionCondition = 'ROOM_PRODUCT_RESTRICTION_CONDITION',
  SecondaryColor = 'SECONDARY_COLOR',
  ServiceChargeSetting = 'SERVICE_CHARGE_SETTING',
  StayOptionRecommendationSetting = 'STAY_OPTION_RECOMMENDATION_SETTING',
  TaxInformation = 'TAX_INFORMATION',
  TermsOfUseUrl = 'TERMS_OF_USE_URL',
  TextColor = 'TEXT_COLOR',
  TimeSliceConfiguration = 'TIME_SLICE_CONFIGURATION',
  UsercentricsCmpSetting = 'USERCENTRICS_CMP_SETTING',
  VatSetting = 'VAT_SETTING',
  WhitelabelSetting = 'WHITELABEL_SETTING',
  WidgetSetting = 'WIDGET_SETTING'
}

export interface HotelConfigurationDetail {
  colorCode?: Maybe<Scalars['String']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  matchingScoreDisplay?: Maybe<Scalars['Float']['output']>;
  maxChildrenAge?: Maybe<Scalars['Int']['output']>;
  maxChildrenCapacity?: Maybe<Scalars['Int']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  minChildrenAge?: Maybe<Scalars['Int']['output']>;
  numberOfResultDisplay?: Maybe<Scalars['Int']['output']>;
  penaltyScore?: Maybe<Scalars['Float']['output']>;
  priorityWeightList?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  shortDescription?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
  vatValue?: Maybe<Scalars['Float']['output']>;
}

export interface HotelConfigurationFilter {
  configType?: InputMaybe<HotelConfigurationConfigTypeEnum>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export enum HotelExpandEnum {
  Country = 'country',
  Currency = 'currency',
  CurrencyRate = 'currencyRate',
  HotelConfiguration = 'hotelConfiguration',
  HotelPaymentAccount = 'hotelPaymentAccount',
  HotelPaymentMode = 'hotelPaymentMode',
  IconImage = 'iconImage'
}

export interface HotelFilter {
  expand?: InputMaybe<Array<InputMaybe<HotelExpandEnum>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  measureMetricList?: InputMaybe<Array<InputMaybe<MeasureMetricEnum>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface HotelPaymentAccount {
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  paymentId?: Maybe<Scalars['String']['output']>;
  publicKey?: Maybe<Scalars['String']['output']>;
  subMerchantId?: Maybe<Scalars['String']['output']>;
  type?: Maybe<HotelPaymentAccountTypeEnum>;
}

export enum HotelPaymentAccountTypeEnum {
  Adyen = 'ADYEN',
  GauvendiPayment = 'GAUVENDI_PAYMENT',
  MewsPayment = 'MEWS_PAYMENT',
  Stripe = 'STRIPE'
}

export interface HotelPaymentMode {
  code?: Maybe<HotelPaymentModeCodeEnum>;
  description?: Maybe<Scalars['String']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export enum HotelPaymentModeCodeEnum {
  Guainv = 'GUAINV',
  Guawcc = 'GUAWCC',
  Guawde = 'GUAWDE',
  Noguar = 'NOGUAR',
  Paypal = 'PAYPAL',
  Pmdoth = 'PMDOTH'
}

export interface HotelPaymentTerm {
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  payAtHotel?: Maybe<Scalars['Float']['output']>;
  payAtHotelDescription?: Maybe<Scalars['String']['output']>;
  payOnConfirmation?: Maybe<Scalars['Float']['output']>;
  payOnConfirmationDescription?: Maybe<Scalars['String']['output']>;
  translationList?: Maybe<Array<Maybe<HotelPaymentTermTranslation>>>;
}

export interface HotelPaymentTermTranslation {
  description?: Maybe<Scalars['String']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  hotelPaymentTermId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  languageCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  payAtHotelDescription?: Maybe<Scalars['String']['output']>;
  payOnConfirmationDescription?: Maybe<Scalars['String']['output']>;
}

export interface HotelRatePlanFilter {
  arrival: Scalars['DateTime']['input'];
  code?: InputMaybe<Scalars['String']['input']>;
  departure: Scalars['DateTime']['input'];
  expand?: InputMaybe<Array<InputMaybe<RatePlanExpandEnum>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  rfcCode?: InputMaybe<Scalars['String']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface HotelRestriction {
  code?: Maybe<HotelRestrictionCodeEnum>;
  fromDate?: Maybe<Scalars['Date']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  toDate?: Maybe<Scalars['Date']['output']>;
  value?: Maybe<Scalars['String']['output']>;
}

export enum HotelRestrictionCodeEnum {
  RstrAvailablePeriod = 'RSTR_AVAILABLE_PERIOD',
  RstrCloseToArrival = 'RSTR_CLOSE_TO_ARRIVAL',
  RstrCloseToDeparture = 'RSTR_CLOSE_TO_DEPARTURE',
  RstrCloseToStay = 'RSTR_CLOSE_TO_STAY',
  RstrLosMax = 'RSTR_LOS_MAX',
  RstrLosMin = 'RSTR_LOS_MIN',
  RstrMinAdvanceBooking = 'RSTR_MIN_ADVANCE_BOOKING',
  RstrMinLosThrough = 'RSTR_MIN_LOS_THROUGH',
  RstrStayThroughDay = 'RSTR_STAY_THROUGH_DAY'
}

export interface HotelRestrictionFilter {
  codeList?: InputMaybe<Array<InputMaybe<HotelRestrictionCodeEnum>>>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode: Scalars['String']['input'];
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface HotelRetailCategory {
  categoryType?: Maybe<CategoryTypeEnum>;
  code?: Maybe<Scalars['String']['output']>;
  displaySequence?: Maybe<Scalars['Int']['output']>;
  hotelRetailFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  iconImageUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  templateRetailCategory?: Maybe<TemplateRetailCategory>;
}

export enum HotelRetailCategoryExpandEnum {
  IconImage = 'iconImage',
  RetailFeature = 'retailFeature',
  TemplateRetailCategory = 'templateRetailCategory'
}

export interface HotelRetailCategoryFilter {
  expand?: InputMaybe<Array<InputMaybe<HotelRetailCategoryExpandEnum>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelRetailCategoryIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  retailCategoryCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface HotelRetailFeature {
  baseRate?: Maybe<Scalars['BigDecimal']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displaySequence?: Maybe<Scalars['Int']['output']>;
  hotelRetailCategory?: Maybe<HotelRetailCategory>;
  id?: Maybe<Scalars['UUID']['output']>;
  matched?: Maybe<Scalars['Boolean']['output']>;
  measurementUnit?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  occasion?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  occasionList?: Maybe<Array<Maybe<HotelTag>>>;
  quantity?: Maybe<Scalars['Int']['output']>;
  retailFeatureImageList?: Maybe<Array<Maybe<HotelRetailFeatureImage>>>;
  shortDescription?: Maybe<Scalars['String']['output']>;
  templateRetailFeature?: Maybe<TemplateRetailFeature>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  travelTag?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  travelTagList?: Maybe<Array<Maybe<HotelTag>>>;
}

export enum HotelRetailFeatureExpandEnum {
  FeatureImage = 'featureImage',
  HotelTag = 'hotelTag',
  MainFeatureImage = 'mainFeatureImage'
}

export interface HotelRetailFeatureFilter {
  expand?: InputMaybe<Array<InputMaybe<HotelRetailFeatureExpandEnum>>>;
  fromTime?: InputMaybe<Scalars['String']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelRetailIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  retailCategoryCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  retailCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toTime?: InputMaybe<Scalars['String']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface HotelRetailFeatureImage {
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  mainImage?: Maybe<Scalars['Boolean']['output']>;
}

export interface HotelRetailFeatureRate {
  dateOfRate?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  retailFeatureRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface HotelRetailFeatureRateFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromTime?: InputMaybe<Scalars['String']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelRetailFeatureIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  retailFeatureCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toTime?: InputMaybe<Scalars['String']['input']>;
}

export enum HotelServiceChargeSettingEnum {
  Exclusive = 'EXCLUSIVE',
  Inclusive = 'INCLUSIVE'
}

export interface HotelStandardFeature {
  baseRate?: Maybe<Scalars['BigDecimal']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displaySequence?: Maybe<Scalars['Int']['output']>;
  iconImageUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  /** deprecated */
  standardFeatureRateList?: Maybe<Array<Maybe<HotelAmenityRate>>>;
  templateStandardFeature?: Maybe<TemplateStandardFeature>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface HotelStandardFeatureFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromTime?: InputMaybe<Scalars['String']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelStandardFeatureIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  standardFeatureCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toTime?: InputMaybe<Scalars['String']['input']>;
}

export interface HotelStandardFeatureRate {
  dateOfRate?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  standardFeatureRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface HotelStandardFeatureRateFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromTime?: InputMaybe<Scalars['String']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelStandardFeatureIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  standardFeatureCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toTime?: InputMaybe<Scalars['String']['input']>;
}

export interface HotelTag {
  assignedFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  code?: Maybe<Scalars['String']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  type?: Maybe<HotelTagType>;
}

export interface HotelTagFilter {
  codeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  idList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
  typeList?: InputMaybe<Array<InputMaybe<HotelTagType>>>;
}

export enum HotelTagType {
  Occasion = 'OCCASION',
  TravelTag = 'TRAVEL_TAG'
}

export interface HotelTax {
  amount?: Maybe<Scalars['BigDecimal']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  rate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface HotelTaxFilter {
  codeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  idList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface HotelTaxInput {
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rate?: InputMaybe<Scalars['BigDecimal']['input']>;
}

export enum HotelTaxSettingEnum {
  Exclusive = 'EXCLUSIVE',
  Inclusive = 'INCLUSIVE'
}

export enum HotelTaxTypeEnum {
  Accommodation = 'ACCOMMODATION',
  Extras = 'EXTRAS',
  Others = 'OTHERS'
}

export interface HotelTemplateEmail {
  closingSection?: Maybe<Scalars['String']['output']>;
  code?: Maybe<HotelTemplateEmailCode>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  languageCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  signature?: Maybe<Scalars['String']['output']>;
  templateId?: Maybe<Scalars['String']['output']>;
}

export enum HotelTemplateEmailCode {
  BookingConfirmation = 'BOOKING_CONFIRMATION',
  BookingConfirmationV2 = 'BOOKING_CONFIRMATION_V2',
  CppBookingConfirmation = 'CPP_BOOKING_CONFIRMATION',
  CppProposalBookingConfirmation = 'CPP_PROPOSAL_BOOKING_CONFIRMATION',
  CppVerifyBookingConfirmation = 'CPP_VERIFY_BOOKING_CONFIRMATION',
  ProposalBookingConfirmation = 'PROPOSAL_BOOKING_CONFIRMATION',
  ReleasedEmail = 'RELEASED_EMAIL',
  ReservationCancellation = 'RESERVATION_CANCELLATION',
  VoiceBookingConfirmation = 'VOICE_BOOKING_CONFIRMATION'
}

export interface IbeHotelPaymentTermFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode: Scalars['String']['input'];
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface IbeHotelTemplateEmailFilter {
  codeList?: InputMaybe<Array<InputMaybe<HotelTemplateEmailCode>>>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode: Scalars['String']['input'];
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface IbeNearestAvailableDate {
  arrival?: Maybe<Scalars['Date']['output']>;
  departure?: Maybe<Scalars['Date']['output']>;
}

export interface IbeNearestAvailableDateFilter {
  fromDate?: InputMaybe<Scalars['Date']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['Int']['input']>;
}

export interface IbeRoomProductIncludedHotelExtraListFilter {
  fromDate: Scalars['Date']['input'];
  propertyCode: Scalars['String']['input'];
  roomProductSalesPlanCode: Scalars['String']['input'];
  roomRequest?: InputMaybe<RoomRequest>;
  toDate: Scalars['Date']['input'];
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface IncludedHotelExtrasFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export enum LanguageCode {
  Ar = 'AR',
  De = 'DE',
  Es = 'ES',
  Fr = 'FR',
  It = 'IT',
  Nl = 'NL'
}

export interface LinkedAmenityDto {
  code?: Maybe<Scalars['String']['output']>;
  quantity?: Maybe<Scalars['Int']['output']>;
}

export interface LowestHighestPriceRfcFilter {
  date?: InputMaybe<Scalars['Date']['input']>;
  guestCount?: InputMaybe<Scalars['Int']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
}

export interface LowestPriceAvailableDateFilter {
  adults: Scalars['Int']['input'];
  childrenAgeList?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  fromDate: Scalars['Date']['input'];
  propertyCode: Scalars['String']['input'];
  toDate: Scalars['Date']['input'];
}

export interface LowestPriceOptionInput {
  roomProductCode?: InputMaybe<Scalars['String']['input']>;
  salesPlanCode?: InputMaybe<Scalars['String']['input']>;
}

export enum MeasureMetricEnum {
  Sqft = 'sqft',
  Sqm = 'sqm'
}

export interface Mutation {
  calculateBookingPricing?: Maybe<ResponseContent>;
  completeBooking?: Maybe<ResponseContent>;
  completeBookingPayment?: Maybe<ResponseContent>;
  confirmBookingPayment?: Maybe<ResponseContent>;
  confirmBookingProposal?: Maybe<ResponseContent>;
  declineProposalBooking?: Maybe<ResponseContent>;
  generateTransaction?: Maybe<ResponseContent>;
  /**  start ise booking saga */
  requestBooking?: Maybe<ResponseContent>;
  toggleRemoteLogging?: Maybe<ResponseContent>;
  updateBookingInformation?: Maybe<ResponseContent>;
}


export interface MutationCalculateBookingPricingArgs {
  input?: InputMaybe<CalculateBookingPricingInput>;
}


export interface MutationCompleteBookingArgs {
  input?: InputMaybe<CompleteBookingInput>;
}


export interface MutationCompleteBookingPaymentArgs {
  booking?: InputMaybe<BookingInput>;
  paymentIntent?: InputMaybe<PaymentIntentInput>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}


export interface MutationConfirmBookingPaymentArgs {
  input?: InputMaybe<ConfirmBookingPaymentInput>;
}


export interface MutationConfirmBookingProposalArgs {
  input?: InputMaybe<ConfirmBookingProposalInput>;
}


export interface MutationDeclineProposalBookingArgs {
  input?: InputMaybe<DeclineProposalBookingInput>;
}


export interface MutationGenerateTransactionArgs {
  input?: InputMaybe<GenerateTransactionInput>;
}


export interface MutationRequestBookingArgs {
  request?: InputMaybe<RequestBookingPaymentInput>;
}


export interface MutationToggleRemoteLoggingArgs {
  isEnable?: InputMaybe<Scalars['Boolean']['input']>;
  isEnableResponse?: InputMaybe<Scalars['Boolean']['input']>;
}


export interface MutationUpdateBookingInformationArgs {
  input?: InputMaybe<BookingInput>;
}

export interface NearestAvailableDateFilter {
  fromDate?: InputMaybe<Scalars['Date']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  stayOptionCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  stayOptionTypeList?: InputMaybe<Array<InputMaybe<StayOptionTypeEnum>>>;
}

export interface NumberComparison {
  operation?: InputMaybe<NumberOperatorEnum>;
  value?: InputMaybe<Scalars['BigDecimal']['input']>;
}

export enum NumberOperatorEnum {
  Equal = 'EQUAL',
  Greater = 'GREATER',
  GreaterEqual = 'GREATER_EQUAL',
  Lesser = 'LESSER',
  LesserEqual = 'LESSER_EQUAL',
  NotEqual = 'NOT_EQUAL'
}

export interface Organisation {
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export interface OrganisationWidgetConfig {
  organisation?: Maybe<Organisation>;
  propertyList?: Maybe<Array<Maybe<Hotel>>>;
  widgetConfigList?: Maybe<Array<Maybe<WidgetConfig>>>;
}

export interface OrganisationWidgetConfigFilter {
  organisationCode?: InputMaybe<Scalars['String']['input']>;
  organisationId?: InputMaybe<Scalars['UUID']['input']>;
}

export interface PaymentInfoInput {
  accountHolder?: InputMaybe<Scalars['String']['input']>;
  accountNumber?: InputMaybe<Scalars['String']['input']>;
  paymentMethod?: InputMaybe<Scalars['String']['input']>;
  referenceNumber?: InputMaybe<Scalars['String']['input']>;
  transactionNumber?: InputMaybe<Scalars['String']['input']>;
}

export interface PaymentInput {
  hotelPaymentAccountType?: InputMaybe<HotelPaymentAccountTypeEnum>;
  id: Scalars['String']['input'];
}

export interface PaymentIntent {
  clientSecret?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
}

export interface PaymentIntentInput {
  clientSecret?: InputMaybe<Scalars['String']['input']>;
  hotelPaymentAccountType?: InputMaybe<HotelPaymentAccountTypeEnum>;
  id: Scalars['String']['input'];
  paymentProviderCode?: InputMaybe<PaymentProviderCodeEnum>;
}

export interface PaymentMethodDetails {
  metadata?: Maybe<PropertyPaymentMethodSettingMetadata>;
  paymentProvider?: Maybe<GlobalPaymentProvider>;
}

export interface PaymentOptionsBySalesPlanFilter {
  arrival?: InputMaybe<Scalars['Date']['input']>;
  departure?: InputMaybe<Scalars['Date']['input']>;
  propertyCode: Scalars['String']['input'];
  salesPlanCodeList: Array<InputMaybe<Scalars['String']['input']>>;
}

export enum PaymentProviderCodeEnum {
  Adyen = 'ADYEN',
  ApaleoPay = 'APALEO_PAY',
  GauvendiPay = 'GAUVENDI_PAY',
  MewsPayment = 'MEWS_PAYMENT',
  OnePay = 'ONE_PAY',
  Opi = 'OPI',
  Paypal = 'PAYPAL'
}

export interface PaymentTermFilter {
  code?: InputMaybe<Scalars['String']['input']>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelId?: InputMaybe<Scalars['UUID']['input']>;
  idList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface PaymentTermInput {
  code?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
}

export interface PersonInput {
  address?: InputMaybe<Scalars['String']['input']>;
  age?: InputMaybe<Scalars['Int']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  countryId?: InputMaybe<Scalars['UUID']['input']>;
  emailAddress?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  isAdult?: InputMaybe<Scalars['Boolean']['input']>;
  isBooker?: InputMaybe<Scalars['Boolean']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phoneInfo?: InputMaybe<PhoneInfoInput>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
}

export interface PhoneInfo {
  phoneCode?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
}

export interface PhoneInfoInput {
  labelCode?: InputMaybe<Scalars['String']['input']>;
  phoneCode?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
}

export enum PricingUnitEnum {
  Item = 'ITEM',
  Night = 'NIGHT',
  Person = 'PERSON',
  PerPersonPerRoom = 'PER_PERSON_PER_ROOM',
  Room = 'ROOM'
}

export interface PriorityModel {
  codeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sequence?: InputMaybe<Scalars['Int']['input']>;
}

export interface PropertyBranding {
  key?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
}

export interface PropertyBrandingFilter {
  propertyCode?: InputMaybe<Scalars['String']['input']>;
}

export interface PropertyMainFont {
  fontName?: Maybe<Scalars['String']['output']>;
  fontWeightDetailsList?: Maybe<Array<Maybe<FontWeightDetails>>>;
  isCustomFont?: Maybe<Scalars['Boolean']['output']>;
}

export interface PropertyMainFontFilter {
  propertyCode?: InputMaybe<Scalars['String']['input']>;
}

export interface PropertyPaymentMethodSetting {
  globalPaymentMethodId?: Maybe<Scalars['UUID']['output']>;
  globalPaymentProviderId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  metadata?: Maybe<PropertyPaymentMethodSettingMetadata>;
  propertyId?: Maybe<Scalars['UUID']['output']>;
  status?: Maybe<PropertyPaymentMethodSettingStatusEnum>;
}

export interface PropertyPaymentMethodSettingMetadata {
  metadata?: Maybe<Scalars['JSON']['output']>;
  value?: Maybe<Scalars['String']['output']>;
}

export enum PropertyPaymentMethodSettingStatusEnum {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

export interface Query {
  availableAmenity?: Maybe<ResponseData>;
  availableDailyRate?: Maybe<ResponseData>;
  availablePaymentMethodList?: Maybe<ResponseData>;
  availableRfc?: Maybe<ResponseData>;
  bookingStatus?: Maybe<ResponseData>;
  bookingSummary?: Maybe<Booking>;
  bundleSalesPlanList?: Maybe<ResponseData>;
  calendarDailyRateList?: Maybe<ResponseData>;
  countryList?: Maybe<Array<Maybe<Country>>>;
  cppBookingSummary?: Maybe<Booking>;
  currencyList?: Maybe<Array<Maybe<Currency>>>;
  dedicatedStayOptionList?: Maybe<ResponseData>;
  hotelConfigurationList?: Maybe<ResponseData>;
  hotelList?: Maybe<ResponseData>;
  hotelRestrictionList?: Maybe<ResponseData>;
  hotelRetailCategoryList?: Maybe<ResponseData>;
  hotelRetailFeatureList?: Maybe<ResponseData>;
  hotelStandardFeatureList?: Maybe<ResponseData>;
  hotelTagList?: Maybe<ResponseData>;
  hotelTemplateEmailList?: Maybe<ResponseData>;
  ibeNearestAvailableDate?: Maybe<ResponseData>;
  includedHotelExtrasList?: Maybe<ResponseData>;
  lowestHighestPriceRfc?: Maybe<ResponseData>;
  lowestPriceAvailableDate?: Maybe<ResponseData>;
  nearestAvailableDate?: Maybe<ResponseData>;
  organisationWidgetDetails?: Maybe<ResponseData>;
  paymentOptionsBySalesPlan?: Maybe<ResponseData>;
  propertyBrandingList?: Maybe<ResponseData>;
  propertyMainFontInformation?: Maybe<ResponseData>;
  ratePlanList?: Maybe<ResponseData>;
  roomProductIncludedHotelExtraList?: Maybe<ResponseData>;
  searchMatchingRfc?: Maybe<ResponseData>;
  searchMatchingRfcV2?: Maybe<ResponseData>;
  stayOptionList?: Maybe<ResponseData>;
  stayOptionRecommendationList?: Maybe<ResponseData>;
  stayOptionRecommendationListV2?: Maybe<ResponseData>;
  stayOptionRecommendationPrimary?: Maybe<ResponseData>;
  stayOptionSuggestionByPrimary?: Maybe<ResponseData>;
  stayOptionSuggestionList?: Maybe<ResponseData>;
  suggestedFeatureSet?: Maybe<ResponseData>;
  surchargeAmenityList?: Maybe<ResponseData>;
  widgetEventFeatureRecommendationList?: Maybe<ResponseContent>;
  widgetPropertyList?: Maybe<ResponseContent>;
  widgetPropertyPrice?: Maybe<ResponseData>;
}


export interface QueryAvailableAmenityArgs {
  filter?: InputMaybe<HotelAmenityFilter>;
}


export interface QueryAvailableDailyRateArgs {
  filter?: InputMaybe<CalendarRateFilter>;
}


export interface QueryAvailablePaymentMethodListArgs {
  filter?: InputMaybe<AvailablePaymentMethodFilter>;
}


export interface QueryAvailableRfcArgs {
  bookingRequest?: InputMaybe<BookingRequest>;
}


export interface QueryBookingStatusArgs {
  filter?: InputMaybe<BookingStatusFilter>;
}


export interface QueryBookingSummaryArgs {
  filter?: InputMaybe<BookingFilter>;
}


export interface QueryBundleSalesPlanListArgs {
  filter?: InputMaybe<BundleSalesPlanFilter>;
}


export interface QueryCalendarDailyRateListArgs {
  filter?: InputMaybe<CalendarDailyRateFilter>;
}


export interface QueryCountryListArgs {
  filter?: InputMaybe<CountryFilter>;
}


export interface QueryCppBookingSummaryArgs {
  filter?: InputMaybe<CppBookingSummaryFilter>;
}


export interface QueryDedicatedStayOptionListArgs {
  filter?: InputMaybe<StayOptionFilter>;
}


export interface QueryHotelConfigurationListArgs {
  filter?: InputMaybe<HotelConfigurationFilter>;
}


export interface QueryHotelListArgs {
  filter?: InputMaybe<HotelFilter>;
}


export interface QueryHotelRestrictionListArgs {
  filter?: InputMaybe<HotelRestrictionFilter>;
}


export interface QueryHotelRetailCategoryListArgs {
  filter?: InputMaybe<HotelRetailCategoryFilter>;
}


export interface QueryHotelRetailFeatureListArgs {
  filter?: InputMaybe<HotelRetailFeatureFilter>;
}


export interface QueryHotelStandardFeatureListArgs {
  filter?: InputMaybe<HotelStandardFeatureFilter>;
}


export interface QueryHotelTagListArgs {
  filter?: InputMaybe<HotelTagFilter>;
}


export interface QueryHotelTemplateEmailListArgs {
  filter?: InputMaybe<IbeHotelTemplateEmailFilter>;
}


export interface QueryIbeNearestAvailableDateArgs {
  filter?: InputMaybe<IbeNearestAvailableDateFilter>;
}


export interface QueryIncludedHotelExtrasListArgs {
  filter?: InputMaybe<IncludedHotelExtrasFilter>;
}


export interface QueryLowestHighestPriceRfcArgs {
  filter?: InputMaybe<LowestHighestPriceRfcFilter>;
}


export interface QueryLowestPriceAvailableDateArgs {
  filter?: InputMaybe<LowestPriceAvailableDateFilter>;
}


export interface QueryNearestAvailableDateArgs {
  filter?: InputMaybe<NearestAvailableDateFilter>;
}


export interface QueryOrganisationWidgetDetailsArgs {
  filter?: InputMaybe<OrganisationWidgetConfigFilter>;
}


export interface QueryPaymentOptionsBySalesPlanArgs {
  filter?: InputMaybe<PaymentOptionsBySalesPlanFilter>;
}


export interface QueryPropertyBrandingListArgs {
  filter?: InputMaybe<PropertyBrandingFilter>;
}


export interface QueryPropertyMainFontInformationArgs {
  filter?: InputMaybe<PropertyMainFontFilter>;
}


export interface QueryRatePlanListArgs {
  filter?: InputMaybe<HotelRatePlanFilter>;
}


export interface QueryRoomProductIncludedHotelExtraListArgs {
  filter?: InputMaybe<IbeRoomProductIncludedHotelExtraListFilter>;
}


export interface QuerySearchMatchingRfcArgs {
  filter?: InputMaybe<SearchMatchingRfcFilter>;
}


export interface QuerySearchMatchingRfcV2Args {
  filter?: InputMaybe<SearchMatchingRfcFilter>;
}


export interface QueryStayOptionListArgs {
  filter?: InputMaybe<StayOptionFilter>;
}


export interface QueryStayOptionRecommendationListArgs {
  filter?: InputMaybe<StayOptionRecommendationFilter>;
}


export interface QueryStayOptionRecommendationListV2Args {
  filter?: InputMaybe<StayOptionRecommendationFilter>;
}


export interface QueryStayOptionRecommendationPrimaryArgs {
  filter?: InputMaybe<StayOptionRecommendationFilter>;
}


export interface QueryStayOptionSuggestionByPrimaryArgs {
  filter?: InputMaybe<StayOptionSuggestionFilter>;
}


export interface QueryStayOptionSuggestionListArgs {
  filter?: InputMaybe<StayOptionSuggestionFilter>;
}


export interface QuerySuggestedFeatureSetArgs {
  filter?: InputMaybe<SuggestedFeatureSetFilter>;
}


export interface QuerySurchargeAmenityListArgs {
  filter?: InputMaybe<HotelAmenityFilter>;
}


export interface QueryWidgetEventFeatureRecommendationListArgs {
  filter?: InputMaybe<WidgetEventFeatureRecommendationListFilter>;
}


export interface QueryWidgetPropertyListArgs {
  filter?: InputMaybe<WidgetPropertyListFilter>;
}


export interface QueryWidgetPropertyPriceArgs {
  filter?: InputMaybe<Array<InputMaybe<WidgetPropertyPriceFilter>>>;
}

export interface RatePlan {
  IsPromoted?: Maybe<Scalars['Boolean']['output']>;
  cancellationFeeUnit?: Maybe<CancellationFeeUnitEnum>;
  cancellationFeeValue?: Maybe<Scalars['Float']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displayUnit?: Maybe<CancellationPolicyDisplayUnitEnum>;
  hotelCancellationPolicy?: Maybe<HotelCancellationPolicy>;
  hotelCxlPolicyCode?: Maybe<Scalars['String']['output']>;
  hotelExtrasCodeList?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  hotelPaymentTerm?: Maybe<HotelPaymentTerm>;
  hourPrior?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  includedHotelExtrasList?: Maybe<Array<Maybe<HotelAmenity>>>;
  mandatoryHotelExtrasIdList?: Maybe<Array<Maybe<Scalars['UUID']['output']>>>;
  mandatoryHotelExtrasList?: Maybe<Array<Maybe<HotelAmenity>>>;
  name?: Maybe<Scalars['String']['output']>;
  payAtHotel?: Maybe<Scalars['Float']['output']>;
  payOnConfirmation?: Maybe<Scalars['Float']['output']>;
  paymentTermCode?: Maybe<Scalars['String']['output']>;
  salesPlanBundleSettings?: Maybe<SalesPlanBundleSettings>;
  salesPlanImageList?: Maybe<Array<Maybe<SalesPlanImage>>>;
  strongestCxlPolicy?: Maybe<HotelCancellationPolicy>;
  strongestCxlPolicyCode?: Maybe<Scalars['String']['output']>;
  strongestPaymentTerms?: Maybe<HotelPaymentTerm>;
  strongestPaymentTermsCode?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
}

export enum RatePlanExpandEnum {
  CancellationPolicy = 'cancellationPolicy',
  Payment = 'payment'
}

export interface RatePlanPaymentMapping {
  depositValue?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  paymentTermCode?: Maybe<Scalars['String']['output']>;
  ratePlanId?: Maybe<Scalars['UUID']['output']>;
}

export interface RatePlanRestriction {
  code?: Maybe<RfcRestrictionCodeEnum>;
  fromDate?: Maybe<Scalars['Date']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  ratePlanId?: Maybe<Scalars['UUID']['output']>;
  toDate?: Maybe<Scalars['Date']['output']>;
  value?: Maybe<Scalars['String']['output']>;
}

export interface RequestBookingPaymentInput {
  bookingInformation: BookingInformationInput;
  bookingPageUrl?: InputMaybe<Scalars['String']['input']>;
  browserAgentIp?: InputMaybe<Scalars['String']['input']>;
  browserInfo?: InputMaybe<BrowserInfo>;
  creditCardInformation?: InputMaybe<CreditCardInformationInput>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  hotelPaymentAccountType?: InputMaybe<HotelPaymentAccountTypeEnum>;
  lowestPriceOptionList?: InputMaybe<Array<InputMaybe<LowestPriceOptionInput>>>;
  occasionCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  origin?: InputMaybe<Scalars['String']['input']>;
  paymentProviderCode?: InputMaybe<PaymentProviderCodeEnum>;
  priorityCategoryCodeList?: InputMaybe<Array<InputMaybe<PriorityModel>>>;
  promoCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  transactionId?: InputMaybe<Scalars['String']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
  travelTagCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface Reservation {
  additionalGuest?: Maybe<Array<Maybe<Guest>>>;
  adjustmentPercentage?: Maybe<Scalars['BigDecimal']['output']>;
  adrSubTotal?: Maybe<Scalars['BigDecimal']['output']>;
  adrSubTotalBySetting?: Maybe<Scalars['BigDecimal']['output']>;
  adult?: Maybe<Scalars['Int']['output']>;
  amenityList?: Maybe<Array<Maybe<HotelAmenity>>>;
  arrival?: Maybe<Scalars['DateTime']['output']>;
  averageDailyRate?: Maybe<Scalars['BigDecimal']['output']>;
  balance?: Maybe<Scalars['BigDecimal']['output']>;
  booking?: Maybe<BookingInformation>;
  bookingFlow?: Maybe<BookingFlow>;
  bookingId?: Maybe<Scalars['UUID']['output']>;
  bookingLanguage?: Maybe<Scalars['String']['output']>;
  cancellationFee?: Maybe<Scalars['BigDecimal']['output']>;
  cancellationType?: Maybe<Scalars['String']['output']>;
  cancelledBy?: Maybe<Scalars['String']['output']>;
  cancelledDate?: Maybe<Scalars['DateTime']['output']>;
  cancelledReason?: Maybe<Scalars['String']['output']>;
  channel?: Maybe<Scalars['String']['output']>;
  childrenAgeList?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  cityTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  company?: Maybe<Company>;
  companyId?: Maybe<Scalars['UUID']['output']>;
  createdDate?: Maybe<Scalars['String']['output']>;
  currencyCode?: Maybe<Scalars['String']['output']>;
  cxlPolicy?: Maybe<HotelCancellationPolicy>;
  cxlPolicyCode?: Maybe<Scalars['String']['output']>;
  departure?: Maybe<Scalars['DateTime']['output']>;
  guestNote?: Maybe<Scalars['String']['output']>;
  hotelPaymentModeCode?: Maybe<Scalars['String']['output']>;
  hourPrior?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  mappingReservationCode?: Maybe<Scalars['String']['output']>;
  matchedFeature?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  matchedFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  payAtHotelAmount?: Maybe<Scalars['BigDecimal']['output']>;
  payOnConfirmationAmount?: Maybe<Scalars['BigDecimal']['output']>;
  paymentTerm?: Maybe<HotelPaymentTerm>;
  paymentTermCode?: Maybe<Scalars['String']['output']>;
  pets?: Maybe<Scalars['Int']['output']>;
  primaryGuest?: Maybe<Guest>;
  primaryGuestId?: Maybe<Scalars['UUID']['output']>;
  promoCodeList?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  propertyId?: Maybe<Scalars['UUID']['output']>;
  reservationAmenityList?: Maybe<Array<Maybe<ReservationAmenity>>>;
  reservationCityTaxList?: Maybe<Array<Maybe<HotelCityTax>>>;
  reservationComment?: Maybe<Scalars['String']['output']>;
  reservationNumber?: Maybe<Scalars['String']['output']>;
  reservationRoomList?: Maybe<Array<Maybe<ReservationRoom>>>;
  reservationTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  reservationTimeSliceList?: Maybe<Array<Maybe<ReservationTimeSlice>>>;
  rfc?: Maybe<Rfc>;
  rfcRatePlan?: Maybe<RfcRatePlan>;
  rfcRatePlanId?: Maybe<Scalars['UUID']['output']>;
  roomId?: Maybe<Scalars['UUID']['output']>;
  salesPlanId?: Maybe<Scalars['UUID']['output']>;
  salesPlanType?: Maybe<Scalars['String']['output']>;
  serviceChargeAmount?: Maybe<Scalars['BigDecimal']['output']>;
  shouldShowStrikeThrough?: Maybe<Scalars['Boolean']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  specialRequest?: Maybe<Scalars['String']['output']>;
  status?: Maybe<ReservationStatusEnum>;
  stayOption?: Maybe<StayOption>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalAccommodationAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmountBeforeAdjustment?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmountBeforeAdjustment?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRateBySetting?: Maybe<Scalars['BigDecimal']['output']>;
  tripPurpose?: Maybe<Scalars['String']['output']>;
  vatAmount?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface ReservationAmenity {
  ageCategory?: Maybe<HotelAgeCategory>;
  ageCategoryCode?: Maybe<Scalars['String']['output']>;
  hotelAmenity?: Maybe<HotelAmenity>;
  hotelAmenityId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  reservationAmenityDateList?: Maybe<Array<Maybe<ReservationAmenityDate>>>;
  reservationId?: Maybe<Scalars['UUID']['output']>;
  serviceChargeAmount?: Maybe<Scalars['BigDecimal']['output']>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface ReservationAmenityAgeCategoryPricing {
  ageCategoryCode?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  fromAge?: Maybe<Scalars['Int']['output']>;
  toAge?: Maybe<Scalars['Int']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface ReservationAmenityComboItemPricing {
  ageCategoryPricingList?: Maybe<Array<Maybe<ReservationAmenityAgeCategoryPricing>>>;
  amenityPricingDateList?: Maybe<Array<Maybe<ReservationAmenityPricingDate>>>;
  count?: Maybe<Scalars['Int']['output']>;
  hotelAmenity?: Maybe<HotelAmenity>;
  masterHotelAmenityId?: Maybe<Scalars['UUID']['output']>;
  serviceChargeAmount?: Maybe<Scalars['BigDecimal']['output']>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  taxDetailsMap?: Maybe<Scalars['String']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface ReservationAmenityDate {
  count?: Maybe<Scalars['Int']['output']>;
  date?: Maybe<Scalars['Date']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  reservationAmenityId?: Maybe<Scalars['UUID']['output']>;
  serviceChargeAmount?: Maybe<Scalars['BigDecimal']['output']>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface ReservationAmenityPricing {
  ageCategoryPricingList?: Maybe<Array<Maybe<ReservationAmenityAgeCategoryPricing>>>;
  amenityPricingDateList?: Maybe<Array<Maybe<ReservationAmenityPricingDate>>>;
  averageDailyRate?: Maybe<Scalars['BigDecimal']['output']>;
  comboItemPricingList?: Maybe<Array<Maybe<ReservationAmenityComboItemPricing>>>;
  count?: Maybe<Scalars['Int']['output']>;
  hotelAmenity?: Maybe<HotelAmenity>;
  isCombo?: Maybe<Scalars['Boolean']['output']>;
  isSalesPlanIncluded?: Maybe<Scalars['Boolean']['output']>;
  serviceChargeAmount?: Maybe<Scalars['BigDecimal']['output']>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  taxDetailsMap?: Maybe<Scalars['String']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface ReservationAmenityPricingDate {
  count?: Maybe<Scalars['Int']['output']>;
  date?: Maybe<Scalars['Date']['output']>;
}

export interface ReservationInput {
  additionalGuestList?: InputMaybe<Array<InputMaybe<PersonInput>>>;
  adult?: InputMaybe<Scalars['Int']['input']>;
  amenityList?: InputMaybe<Array<InputMaybe<HotelAmenityInput>>>;
  childrenAgeList?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  guestNote?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  pets?: InputMaybe<Scalars['Int']['input']>;
  primaryGuest?: InputMaybe<PersonInput>;
  priorityCategoryCodeList?: InputMaybe<Array<InputMaybe<PriorityModel>>>;
  reservationNumber?: InputMaybe<Scalars['String']['input']>;
  rfcCode?: InputMaybe<Scalars['String']['input']>;
  rfcRatePlanCode?: InputMaybe<Scalars['String']['input']>;
  stayOptionCode?: InputMaybe<Scalars['String']['input']>;
  tripPurpose?: InputMaybe<Scalars['String']['input']>;
}

export interface ReservationPricing {
  accommodationTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  accommodationTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  adjustmentPercentage?: Maybe<Scalars['Float']['output']>;
  adrSubTotal?: Maybe<Scalars['BigDecimal']['output']>;
  adrSubTotalBySetting?: Maybe<Scalars['BigDecimal']['output']>;
  adults?: Maybe<Scalars['Int']['output']>;
  allocatedAdults?: Maybe<Scalars['Int']['output']>;
  allocatedChildren?: Maybe<Scalars['Int']['output']>;
  allocatedExtraAdults?: Maybe<Scalars['Int']['output']>;
  allocatedExtraChildren?: Maybe<Scalars['Int']['output']>;
  allocatedPets?: Maybe<Scalars['Int']['output']>;
  amenityPricingList?: Maybe<Array<Maybe<ReservationAmenityPricing>>>;
  arrival?: Maybe<Scalars['DateTime']['output']>;
  averageAccommodationAmount?: Maybe<Scalars['BigDecimal']['output']>;
  averageDailyRate?: Maybe<Scalars['BigDecimal']['output']>;
  calculatedCityTax?: Maybe<CalculatedCityTax>;
  childrenAgeList?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  cityTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  departure?: Maybe<Scalars['DateTime']['output']>;
  extraServiceTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  extraServiceTaxList?: Maybe<Array<Maybe<HotelTax>>>;
  hotelCxlPolicy?: Maybe<HotelCancellationPolicy>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  hotelPaymentTerm?: Maybe<HotelPaymentTerm>;
  index?: Maybe<Scalars['String']['output']>;
  payAtHotelAmount?: Maybe<Scalars['BigDecimal']['output']>;
  payOnConfirmationAmount?: Maybe<Scalars['BigDecimal']['output']>;
  roomProduct?: Maybe<Rfc>;
  roomProductSalesPlan?: Maybe<RfcRatePlan>;
  shouldShowStrikeThrough?: Maybe<Scalars['Boolean']['output']>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  taxDetailsMap?: Maybe<Scalars['String']['output']>;
  totalAccommodationAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalAccommodationAmountBySetting?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmountBeforeAdjustment?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmountBeforeAdjustment?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRateBySetting?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface ReservationRoom {
  id?: Maybe<Scalars['UUID']['output']>;
  reservationId?: Maybe<Scalars['UUID']['output']>;
  room?: Maybe<Room>;
  roomId?: Maybe<Scalars['UUID']['output']>;
}

export enum ReservationStatusEnum {
  Cancelled = 'CANCELLED',
  CheckedIn = 'CHECKED_IN',
  CheckedOut = 'CHECKED_OUT',
  Completed = 'COMPLETED',
  Confirmed = 'CONFIRMED',
  Proposed = 'PROPOSED',
  Released = 'RELEASED',
  Reserved = 'RESERVED'
}

export interface ReservationTimeSlice {
  fromTime?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  reservationId?: Maybe<Scalars['UUID']['output']>;
  rfcId?: Maybe<Scalars['UUID']['output']>;
  roomId?: Maybe<Scalars['UUID']['output']>;
  serviceChargeAmount?: Maybe<Scalars['BigDecimal']['output']>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  toTime?: Maybe<Scalars['DateTime']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface ResponseContent {
  code?: Maybe<Scalars['String']['output']>;
  data?: Maybe<ResponseModel>;
  dataList?: Maybe<Array<Maybe<ResponseModel>>>;
  message?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
}

export interface ResponseData {
  count?: Maybe<Scalars['Int']['output']>;
  data?: Maybe<Array<Maybe<ResponseModel>>>;
  totalPage?: Maybe<Scalars['Int']['output']>;
}

export type ResponseModel = AvailablePaymentMethod | Booking | BookingPaymentResponse | BookingPricing | CalendarDailyRate | ConfirmBookingResponse | DailyRate | Hotel | HotelAmenity | HotelAmenityRate | HotelConfiguration | HotelPaymentMode | HotelPaymentTerm | HotelRestriction | HotelRetailCategory | HotelRetailFeature | HotelRetailFeatureRate | HotelStandardFeature | HotelStandardFeatureRate | HotelTag | HotelTax | HotelTemplateEmail | IbeNearestAvailableDate | OrganisationWidgetConfig | PaymentIntent | PropertyBranding | PropertyMainFont | RatePlan | ReservationPricing | Rfc | RfcDailyRate | RfcRatePlan | Room | RoomAvailability | StayOption | StayOptionSuggestion | TemplateAmenity | TemplateRetailCategory | TemplateRetailFeature | TemplateStandardFeature | Transaction | WidgetEventFeatureRecommendation | WidgetProperty | WidgetPropertyPrice;

export enum RestrictionCodeEnum {
  RstrAvailablePeriod = 'RSTR_AVAILABLE_PERIOD',
  RstrCloseToArrival = 'RSTR_CLOSE_TO_ARRIVAL',
  RstrCloseToDeparture = 'RSTR_CLOSE_TO_DEPARTURE',
  RstrCloseToStay = 'RSTR_CLOSE_TO_STAY',
  RstrLosMax = 'RSTR_LOS_MAX',
  RstrLosMin = 'RSTR_LOS_MIN',
  RstrMaxAdvanceBooking = 'RSTR_MAX_ADVANCE_BOOKING',
  RstrMinAdvanceBooking = 'RSTR_MIN_ADVANCE_BOOKING',
  RstrMinLosThrough = 'RSTR_MIN_LOS_THROUGH',
  RstrStayThroughDay = 'RSTR_STAY_THROUGH_DAY'
}

export interface Rfc {
  additionalFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  allocatedAdultCount?: Maybe<Scalars['Int']['output']>;
  allocatedChildCount?: Maybe<Scalars['Int']['output']>;
  allocatedExtraBedAdultCount?: Maybe<Scalars['Int']['output']>;
  allocatedExtraBedChildCount?: Maybe<Scalars['Int']['output']>;
  allocatedPetCount?: Maybe<Scalars['Int']['output']>;
  availableRateRfcPlanList?: Maybe<Array<Maybe<RfcRatePlan>>>;
  capacityAdult?: Maybe<Scalars['Int']['output']>;
  capacityChildren?: Maybe<Scalars['Int']['output']>;
  capacityDefault?: Maybe<Scalars['Int']['output']>;
  capacityExtra?: Maybe<Scalars['Int']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  extraBedAdult?: Maybe<Scalars['Int']['output']>;
  extraBedKid?: Maybe<Scalars['Int']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  isSpaceTypeSearchMatched?: Maybe<Scalars['Boolean']['output']>;
  layoutFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  matchingPercentage?: Maybe<Scalars['Float']['output']>;
  maximumAdult?: Maybe<Scalars['Int']['output']>;
  maximumKid?: Maybe<Scalars['Int']['output']>;
  maximumPet?: Maybe<Scalars['Int']['output']>;
  mostPopularFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  name?: Maybe<Scalars['String']['output']>;
  numberOfBedrooms?: Maybe<Scalars['Int']['output']>;
  occasion?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  occasionList?: Maybe<Array<Maybe<HotelTag>>>;
  pets?: Maybe<Scalars['Int']['output']>;
  price?: Maybe<Scalars['BigDecimal']['output']>;
  priorityRankingScore?: Maybe<Scalars['Float']['output']>;
  recommendRoomIndexList?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  restrictionValidationList?: Maybe<Array<Maybe<RfcRestriction>>>;
  retailFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  rfcImageList?: Maybe<Array<Maybe<RfcImage>>>;
  rfcRatePlanList?: Maybe<Array<Maybe<RfcRatePlan>>>;
  rfcType?: Maybe<RfcTypeEnum>;
  roomList?: Maybe<Array<Maybe<Room>>>;
  space?: Maybe<Scalars['Int']['output']>;
  standardFeatureList?: Maybe<Array<Maybe<HotelStandardFeature>>>;
  status?: Maybe<RfcStatusEnum>;
  travelTag?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  travelTagList?: Maybe<Array<Maybe<HotelTag>>>;
  unavailableRfcRatePlanList?: Maybe<Array<Maybe<RfcRatePlan>>>;
}

export interface RfcDailyRate {
  dateOfRate?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface RfcDailyRateFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromTime?: InputMaybe<Scalars['BigDecimal']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toTime?: InputMaybe<Scalars['BigDecimal']['input']>;
}

export interface RfcFilter {
  arrival?: InputMaybe<Scalars['BigDecimal']['input']>;
  departure?: InputMaybe<Scalars['BigDecimal']['input']>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  expectedRetailFeatureCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromTime?: InputMaybe<Scalars['BigDecimal']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  nameOrCodeSearching?: InputMaybe<Scalars['String']['input']>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  priorityCategoryCodeList?: InputMaybe<Array<InputMaybe<PriorityModel>>>;
  retailFeatureCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  rfcCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  rfcIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  rfcRatePlanIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  roomFilter?: InputMaybe<Array<InputMaybe<RoomFilter>>>;
  roomStatusList?: InputMaybe<Array<InputMaybe<RoomStatusEnum>>>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toTime?: InputMaybe<Scalars['BigDecimal']['input']>;
}

export interface RfcImage {
  description?: Maybe<Scalars['String']['output']>;
  displaySequence?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  rfcId?: Maybe<Scalars['UUID']['output']>;
}

export interface RfcRatePlan {
  adjustmentPercentage?: Maybe<Scalars['BigDecimal']['output']>;
  averageDailyRate?: Maybe<Scalars['BigDecimal']['output']>;
  cancellationType?: Maybe<CancellationTypeEnum>;
  cityTaxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  guaranteeType?: Maybe<GuaranteeTypeEnum>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  ratePlan?: Maybe<RatePlan>;
  ratePlanId?: Maybe<Scalars['UUID']['output']>;
  restrictionValidationList?: Maybe<Array<Maybe<RatePlanRestriction>>>;
  rfc?: Maybe<Rfc>;
  rfcId?: Maybe<Scalars['UUID']['output']>;
  roomOnlySellingPrice?: Maybe<Scalars['BigDecimal']['output']>;
  serviceChargeAmount?: Maybe<Scalars['BigDecimal']['output']>;
  shouldShowStrikeThrough?: Maybe<Scalars['Boolean']['output']>;
  taxAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseAmountBeforeAdjustment?: Maybe<Scalars['BigDecimal']['output']>;
  totalBaseRate?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmount?: Maybe<Scalars['BigDecimal']['output']>;
  totalGrossAmountBeforeAdjustment?: Maybe<Scalars['BigDecimal']['output']>;
  totalSellingRate?: Maybe<Scalars['BigDecimal']['output']>;
}

export interface RfcRestriction {
  code?: Maybe<RfcRestrictionCodeEnum>;
  fromDate?: Maybe<Scalars['Date']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  rfcId?: Maybe<Scalars['UUID']['output']>;
  toDate?: Maybe<Scalars['Date']['output']>;
  value?: Maybe<Scalars['String']['output']>;
}

export enum RfcRestrictionCodeEnum {
  RstrAvailablePeriod = 'RSTR_AVAILABLE_PERIOD',
  RstrCloseToArrival = 'RSTR_CLOSE_TO_ARRIVAL',
  RstrCloseToDeparture = 'RSTR_CLOSE_TO_DEPARTURE',
  RstrCloseToStay = 'RSTR_CLOSE_TO_STAY',
  RstrLosMax = 'RSTR_LOS_MAX',
  RstrLosMin = 'RSTR_LOS_MIN',
  RstrMinAdvanceBooking = 'RSTR_MIN_ADVANCE_BOOKING',
  RstrMinLosThrough = 'RSTR_MIN_LOS_THROUGH',
  RstrStayThroughDay = 'RSTR_STAY_THROUGH_DAY'
}

export enum RfcStatusEnum {
  Active = 'ACTIVE',
  Draft = 'DRAFT',
  Inactive = 'INACTIVE'
}

export enum RfcTypeEnum {
  AdjacentRoom = 'ADJACENT_ROOM',
  ConnectingRoom = 'CONNECTING_ROOM'
}

export interface Room {
  capacityAdult?: Maybe<Scalars['Int']['output']>;
  capacityChildren?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  retailFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  roomAvailabilityList?: Maybe<Array<Maybe<RoomAvailability>>>;
  roomNumber?: Maybe<Scalars['String']['output']>;
  standardFeatureList?: Maybe<Array<Maybe<HotelStandardFeature>>>;
  status?: Maybe<RoomStatusEnum>;
}

export interface RoomAvailability {
  date?: Maybe<Scalars['Date']['output']>;
  dateOfRoom?: Maybe<Scalars['BigDecimal']['output']>;
  hotelId?: Maybe<Scalars['UUID']['output']>;
  room?: Maybe<Room>;
  roomId?: Maybe<Scalars['UUID']['output']>;
  status?: Maybe<RoomAvailabilityStatusEnum>;
}

export interface RoomAvailabilityFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromTime?: InputMaybe<Scalars['BigDecimal']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  roomIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<Array<InputMaybe<RoomStatusEnum>>>;
  toTime?: InputMaybe<Scalars['BigDecimal']['input']>;
}

export interface RoomAvailabilityInput {
  dateOfRoom?: InputMaybe<Scalars['BigDecimal']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  roomId?: InputMaybe<Scalars['UUID']['input']>;
  status?: InputMaybe<RoomStatusEnum>;
}

export enum RoomAvailabilityStatusEnum {
  Assigned = 'ASSIGNED',
  Available = 'AVAILABLE',
  Blocked = 'BLOCKED',
  OutOfInventory = 'OUT_OF_INVENTORY',
  OutOfOrder = 'OUT_OF_ORDER',
  Unavailable = 'UNAVAILABLE'
}

export interface RoomFilter {
  adultCapacityRequest?: InputMaybe<Scalars['Int']['input']>;
  adultFilter?: InputMaybe<Array<InputMaybe<NumberComparison>>>;
  childrenAgeList?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  childrenFilter?: InputMaybe<Array<InputMaybe<NumberComparison>>>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromTime?: InputMaybe<Scalars['BigDecimal']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  retailFeatureCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  roomAvailabilityList?: InputMaybe<Array<InputMaybe<RoomAvailabilityInput>>>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status?: InputMaybe<Array<InputMaybe<RoomStatusEnum>>>;
  statusList?: InputMaybe<Array<InputMaybe<RoomStatusEnum>>>;
  stayOptionId?: InputMaybe<Scalars['UUID']['input']>;
  toTime?: InputMaybe<Scalars['BigDecimal']['input']>;
}

export interface RoomInput {
  capacityAdult?: InputMaybe<Scalars['Int']['input']>;
  childrenAges?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  rfcId?: InputMaybe<Scalars['UUID']['input']>;
  roomAvailabilityList?: InputMaybe<Array<InputMaybe<RoomAvailabilityInput>>>;
  status?: InputMaybe<RoomStatusEnum>;
  stayOptionId?: InputMaybe<Scalars['UUID']['input']>;
}

export interface RoomRequest {
  adult?: InputMaybe<Scalars['Int']['input']>;
  childrenAgeList?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  pets?: InputMaybe<Scalars['Int']['input']>;
  roomRequestList?: InputMaybe<Array<InputMaybe<RoomRequest>>>;
}

export enum RoomStatusEnum {
  Clean = 'CLEAN',
  Dirty = 'DIRTY',
  Inspected = 'INSPECTED',
  OutOfService = 'OUT_OF_SERVICE'
}

export interface SalesPlanBundleSettings {
  id?: Maybe<Scalars['UUID']['output']>;
  maxAdult?: Maybe<Scalars['Int']['output']>;
  maxChild?: Maybe<Scalars['Int']['output']>;
  maxPet?: Maybe<Scalars['Int']['output']>;
  minAdult?: Maybe<Scalars['Int']['output']>;
  minChild?: Maybe<Scalars['Int']['output']>;
  minPet?: Maybe<Scalars['Int']['output']>;
  propertyId?: Maybe<Scalars['UUID']['output']>;
  salesPlanId?: Maybe<Scalars['UUID']['output']>;
}

export interface SalesPlanImage {
  description?: Maybe<Scalars['String']['output']>;
  displaySequence?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  image?: Maybe<FileLibrary>;
  imageId?: Maybe<Scalars['UUID']['output']>;
  propertyId?: Maybe<Scalars['UUID']['output']>;
  salesPlanId?: Maybe<Scalars['UUID']['output']>;
}

export interface SearchMatchingRfcFilter {
  arrival?: InputMaybe<Scalars['DateTime']['input']>;
  bookingFlow?: InputMaybe<BookingFlow>;
  departure?: InputMaybe<Scalars['DateTime']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  priorityCategoryCodeList?: InputMaybe<Array<InputMaybe<PriorityModel>>>;
  promoCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  ratePlanCode?: InputMaybe<Scalars['String']['input']>;
  rfcCode?: InputMaybe<Scalars['String']['input']>;
  rfcRatePlanCode?: InputMaybe<Scalars['String']['input']>;
  roomRequestList?: InputMaybe<Array<InputMaybe<RoomRequest>>>;
  selectedRfcIdList?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export enum SearchTypeEnum {
  BestMatch = 'BEST_MATCH',
  Normal = 'NORMAL'
}

export interface SearchingRoomInput {
  arrival?: InputMaybe<Scalars['BigDecimal']['input']>;
  departure?: InputMaybe<Scalars['BigDecimal']['input']>;
  hotelCode?: InputMaybe<Scalars['String']['input']>;
  roomList?: InputMaybe<Array<InputMaybe<RoomInput>>>;
}

export interface StayOption {
  adjustPrice?: Maybe<Scalars['BigDecimal']['output']>;
  allocatedAdultCount?: Maybe<Scalars['Int']['output']>;
  allocatedChildCount?: Maybe<Scalars['Int']['output']>;
  amenityList?: Maybe<Array<Maybe<HotelAmenity>>>;
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  mostAvailableRfc?: Maybe<Rfc>;
  name?: Maybe<Scalars['String']['output']>;
  rfcList?: Maybe<Array<Maybe<Rfc>>>;
  stayOptionRfcOptimizationList?: Maybe<Array<Maybe<StayOptionRfcOptimizationDto>>>;
  themeImageUrl?: Maybe<Scalars['String']['output']>;
  type?: Maybe<StayOptionTypeEnum>;
}

export enum StayOptionExpandEnum {
  Amenity = 'amenity',
  ThemeImage = 'themeImage'
}

export interface StayOptionFilter {
  arrival?: InputMaybe<Scalars['DateTime']['input']>;
  dedicatedProductCode?: InputMaybe<Scalars['String']['input']>;
  departure?: InputMaybe<Scalars['DateTime']['input']>;
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hotelCode: Scalars['String']['input'];
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  promoCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  roomRequest?: InputMaybe<RoomRequest>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface StayOptionRecommendationFilter {
  arrival?: InputMaybe<Scalars['DateTime']['input']>;
  bookingFlow?: InputMaybe<BookingFlow>;
  dedicatedProductCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  departure?: InputMaybe<Scalars['DateTime']['input']>;
  hotelCode: Scalars['String']['input'];
  isCombination?: InputMaybe<Scalars['Boolean']['input']>;
  occasionCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  priorityCategoryCodeList?: InputMaybe<Array<InputMaybe<PriorityModel>>>;
  promoCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  roomRequestList?: InputMaybe<Array<InputMaybe<RoomRequest>>>;
  spaceTypeRequestList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  splitToDoubleRooms?: InputMaybe<Scalars['Boolean']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
  travelTagCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface StayOptionRfcOptimizationDto {
  availableRfcList?: Maybe<Array<Maybe<Rfc>>>;
  stayOptionRfcOptimizationType?: Maybe<StayOptionRfcOptimizationTypeEnum>;
  stayOptionRfcRatePlanList?: Maybe<Array<Maybe<RfcRatePlan>>>;
  stayOptionRfcSummaryList?: Maybe<Array<Maybe<StayOptionRfcSummaryDto>>>;
}

export enum StayOptionRfcOptimizationTypeEnum {
  BestMatch = 'BEST_MATCH',
  ClosestMatch = 'CLOSEST_MATCH',
  LowestPrice = 'LOWEST_PRICE'
}

export interface StayOptionRfcSummaryDto {
  count?: Maybe<Scalars['Int']['output']>;
  rfc?: Maybe<Rfc>;
}

export interface StayOptionSuggestion {
  availableRfcList?: Maybe<Array<Maybe<Rfc>>>;
  availableRfcRatePlanList?: Maybe<Array<Maybe<RfcRatePlan>>>;
  featureSuggestionList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  label?: Maybe<BookingFlow>;
  occasionCodeList?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  restrictionValidationList?: Maybe<Array<Maybe<RfcRestriction>>>;
  travelTagCodeList?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  tripRecommendationTitle?: Maybe<Scalars['String']['output']>;
  unavailableRfcRatePlanList?: Maybe<Array<Maybe<RfcRatePlan>>>;
}

export interface StayOptionSuggestionFilter {
  arrival?: InputMaybe<Scalars['DateTime']['input']>;
  departure?: InputMaybe<Scalars['DateTime']['input']>;
  hotelCode: Scalars['String']['input'];
  roomRequestList?: InputMaybe<Array<InputMaybe<RoomRequest>>>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export enum StayOptionSuggestionLabelEnum {
  LowestPrice = 'LOWEST_PRICE',
  MostPopular = 'MOST_POPULAR'
}

export enum StayOptionTypeEnum {
  CustomizedTheme = 'CUSTOMIZED_THEME',
  LowestPrice = 'LOWEST_PRICE',
  MostPopular = 'MOST_POPULAR'
}

export interface SuggestedFeatureSetFilter {
  propertyCode?: InputMaybe<Scalars['String']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface TemplateAmenity {
  amenityType?: Maybe<AmenityTypeEnum>;
  availability?: Maybe<AmenityAvailabilityEnum>;
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  postNextDay?: Maybe<Scalars['Boolean']['output']>;
  pricingUnit?: Maybe<PricingUnitEnum>;
}

export interface TemplateAmenityFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface TemplateRetailCategory {
  categoryType?: Maybe<CategoryTypeEnum>;
  code?: Maybe<Scalars['String']['output']>;
  iconImageUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  templateRetailFeatureList?: Maybe<Array<Maybe<TemplateRetailFeature>>>;
}

export interface TemplateRetailCategoryFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface TemplateRetailFeature {
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  occasion?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  occasionList?: Maybe<Array<Maybe<HotelTag>>>;
  shortDescription?: Maybe<Scalars['String']['output']>;
  templateRetailCategory?: Maybe<TemplateRetailCategory>;
  travelTag?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  travelTagList?: Maybe<Array<Maybe<HotelTag>>>;
}

export interface TemplateRetailFeatureFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface TemplateStandardFeature {
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  iconImageUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
}

export interface TemplateStandardFeatureFilter {
  expand?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
}

export interface Transaction {
  transactionId?: Maybe<Scalars['String']['output']>;
}

export interface WidgetConfig {
  attribute?: Maybe<Scalars['String']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['UUID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  organisationId?: Maybe<Scalars['UUID']['output']>;
  propertyId?: Maybe<Scalars['UUID']['output']>;
  value?: Maybe<Scalars['String']['output']>;
}

export interface WidgetEventFeatureRecommendation {
  event?: Maybe<Scalars['String']['output']>;
  popularRetailFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  travelProfile?: Maybe<Scalars['String']['output']>;
}

export interface WidgetEventFeatureRecommendationListFilter {
  fromDate?: InputMaybe<Scalars['Date']['input']>;
  promoCode?: InputMaybe<Scalars['String']['input']>;
  propertyCode: Scalars['String']['input'];
  roomRequestList?: InputMaybe<Array<InputMaybe<RoomRequest>>>;
  toDate?: InputMaybe<Scalars['Date']['input']>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface WidgetProperty {
  propertyList?: Maybe<Array<Maybe<Hotel>>>;
  retailFeatureList?: Maybe<Array<Maybe<HotelRetailFeature>>>;
  widgetPropertyConfigList?: Maybe<Array<Maybe<WidgetPropertyConfig>>>;
}

export interface WidgetPropertyConfig {
  childrenBookingAllowed?: Maybe<Scalars['JSON']['output']>;
  childrenPolicy?: Maybe<Scalars['JSON']['output']>;
  defaultLanguage?: Maybe<Scalars['JSON']['output']>;
  defaultPax?: Maybe<Scalars['JSON']['output']>;
  defaultStayNights?: Maybe<Scalars['JSON']['output']>;
  propertyId?: Maybe<Scalars['UUID']['output']>;
}

export interface WidgetPropertyListFilter {
  organisationCode?: InputMaybe<Scalars['String']['input']>;
  organisationId?: InputMaybe<Scalars['UUID']['input']>;
  propertyCodeList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  translateTo?: InputMaybe<Scalars['String']['input']>;
}

export interface WidgetPropertyPrice {
  pricePerNight?: Maybe<Scalars['BigDecimal']['output']>;
  pricePerStay?: Maybe<Scalars['BigDecimal']['output']>;
  propertyCode?: Maybe<Scalars['String']['output']>;
}

export interface WidgetPropertyPriceFilter {
  arrival?: InputMaybe<Scalars['Date']['input']>;
  childAgeList?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  departure?: InputMaybe<Scalars['Date']['input']>;
  promoCode?: InputMaybe<Scalars['String']['input']>;
  propertyCode: Scalars['String']['input'];
  totalAdults?: InputMaybe<Scalars['Int']['input']>;
}
