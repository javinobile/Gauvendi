import { ReservationStatusEnum } from '@src/core/entities/booking-entities/reservation.entity';
import { DistributionChannel, HotelPaymentModeCodeEnum, Weekday } from '@src/core/enums/common';
import { ApaleoPersonAddressDto } from '../dtos/apaleo-pms.dto';

export enum ApaleoMaintenanceType {
  OutOfService = 'OutOfService',
  OutOfOrder = 'OutOfOrder',
  OutOfInventory = 'OutOfInventory'
}

export enum ApaleoCondition {
  Clean = 'Clean',
  CleanToBeInspected = 'CleanToBeInspected',
  Dirty = 'Dirty'
}

export enum ApaleoExpand {
  unitGroup = 'unitGroup',
  property = 'property',
  services = 'services',
  cancellationPolicy = 'cancellationPolicy',
  bookingPeriods = 'bookingPeriods',
  surcharges = 'surcharges',
  ageCategories = 'ageCategories'
}

export enum ApaleoType {
  BedRoom = 'BedRoom',
  MeetingRoom = 'MeetingRoom',
  EventSpace = 'EventSpace',
  ParkingLot = 'ParkingLot',
  Other = 'Other'
}

export enum ApaleoAccountServiceType {
  Other = 'Other',
  Accommodation = 'Accommodation',
  FoodAndBeverage = 'FoodAndBeverages'
}

export enum ApaleoVatType {
  Null = 'Null',
  VeryReduced = 'VeryReduced',
  Reduced = 'Reduced',
  Normal = 'Normal',
  Without = 'Without',
  Special = 'Special',
  ReducedCovid19 = 'ReducedCovid19',
  NormalCovid19 = 'NormalCovid19',
  Mixed = 'Mixed'
}

export class ApaleoCommonDto {
  pageNumber: number;
  pageSize: number;

  expand: ApaleoExpand[];
}

export class ApaleoAccessTokenDto {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
  id_token: string;
}

export class ApaleoGetUnitListDto extends ApaleoCommonDto {
  propertyId: string;
  unitGroupIds?: string[];
  unitAttributeIds?: string[];
  isOccupied?: boolean;
  maintenanceType?: ApaleoMaintenanceType;
  condition?: ApaleoCondition;
}

export class ApaleoPropertyDto {
  id: string;
  name: string;
}

export class ApaleoUnitGroupDto {
  id: string;
  code: string;
  name: string;
  description: string;
  type: ApaleoType;
  memberCount: number;
  maxPersons: number;
  rank: number;
  property: ApaleoPropertyDto;
}

export class ApaleoUnitListResponseDto {
  id: string;
  name: string;
  description: string;
  property: ApaleoPropertyDto;
  unitGroup: ApaleoUnitGroupDto;
  status: ApaleoStatusDto;
  maxPersons: number;
  created: string;
  attributes: ApaleoAttributeDto[];
}

export class ApaleoStatusDto {
  isOccupied: boolean;
  condition: ApaleoCondition;
  maintenanceType: ApaleoMaintenanceType;
}

export class ApaleoAttributeDto {
  id: string;
  name: string;
  description: string;
}

export enum ApaleoChannelCode {
  Direct = 'Direct',
  BookingCom = 'BookingCom',
  Ibe = 'Ibe',
  ChannelManager = 'ChannelManager',
  Expedia = 'Expedia',
  Homelike = 'Homelike',
  Hrs = 'Hrs',
  AltoVita = 'AltoVita',
  DesVu = 'DesVu'
}

export class ApaleoGetUnitGroupListDto extends ApaleoCommonDto {
  propertyId: string;
}

export class ApaleoGetRatePlanListDto extends ApaleoCommonDto {
  propertyId: string;
  timeSliceTemplate?: 'DayUse' | 'OverNight';
  isDerived?: boolean;
}
export interface ApaleoCancellationPolicyDto {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface ApaleoNoShowPolicyDto {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface ApaleoTimeSliceDefinitionDto {
  id: string;
  name: string;
  template: 'DayUse' | 'OverNight';
  checkInTime: string;
  checkOutTime: string;
}

export interface ApaleoRatesRangeDto {
  from: string;
  to: string;
}

export interface ApaleoAccountingConfigDto {
  state: string;
  vatType: string;
  serviceType: ApaleoAccountServiceType;
  validFrom: string;
}

export class ApaleoRatePlanDto {
  id: string;
  code: string;
  name: string;
  description: string;
  minGuaranteeType: 'PM6Hold' | 'CreditCard' | 'Prepayment' | 'Company';
  /**
   * The calculation mode is used when calculating the adults' surcharges and derived rates.
    Defaults to Truncate. Example: for a rate of 125.99 and a surcharge of +10%,
    when Truncate is selected, the result would be 125.99 + 12 = 137.99
    when Round is selected, the result would be 125.99 + 12.60 = 138.59
   */
  priceCalculationMode: 'Truncate' | 'Round';
  property: ApaleoPropertyDto;
  unitGroup: ApaleoUnitGroupDto;
  cancellationPolicy: ApaleoCancellationPolicyDto;
  noShowPolicy: ApaleoNoShowPolicyDto;
  channelCodes: string[];
  promoCodes: string[];
  timeSliceDefinition: ApaleoTimeSliceDefinitionDto;
  isBookable: boolean;
  isSubjectToCityTax: boolean;
  isDerived: boolean;
  derivationLevel: number;
  ratesRange: ApaleoRatesRangeDto;
  accountingConfigs: ApaleoAccountingConfigDto[];
}

export class ApaleoGetServiceListDto extends ApaleoCommonDto {
  propertyId: string;
  onlySoldAsExtras: boolean;
  serviceTypes: ApaleoAccountServiceType[];
}

export class ApaleoServiceDto {
  id: string;
  name: string;
  code: string;
  description: string;
  defaultGrossPrice: {
    amount: number;
    currency: string;
  };
  pricingUnit: 'Room' | 'Person';
  postNextDay: boolean;
  serviceType: ApaleoAccountServiceType;
  vatType: string;
  availability: {
    /**
     * 
You can choose if the service will only be offered
for the arrival or departure time slice like early check-in or a final cleaning service. You can also define
a service that is available to be booked for the whole stay. The property defaults to 'Daily'.
     */
    mode: 'Arrival' | 'Departure' | 'Daily';
    daysOfWeek: Weekday[];
  };

  property: ApaleoPropertyDto;
  channelCodes: ApaleoChannelCode[];
}

export class ApaleoGetRatePlanPricingListDto extends ApaleoCommonDto {
  from: string;
  to: string;
}

export class ApaleoGetAvailabilityUnitListDto extends ApaleoCommonDto {
  from: string;
  to: string;
  onlySellable: boolean;
  propertyId: string;
}

export interface ApaleoRatePlanServiceDto {
  value: string;
  path: string;
  op: string;
  from: string;
}

export interface ApaleoRatePlanPricingDto {
  from: string;
  to: string;
  price: {
    amount: number;
    currency: string;
  };
  calculatedPrices: ApaleoCalculatedPrice[];
  restrictions: ApaleoRestrictions;
}

export interface ApaleoCalculatedPrice {
  adults: number;
  price: {
    amount: number;
    currency: string;
  };
}

export interface ApaleoRestrictions {
  maxLengthOfStay: number;
  minLengthOfStay: number;
  closed: boolean;
  closedOnArrival: boolean;
  closedOnDeparture: boolean;
}

export interface ApaleoGetAvailabilityListDto extends ApaleoCommonDto {
  propertyId: string;
  from: string;
  to: string;
  onlySellable: boolean;
}

export interface ApaleoAvailabilityDto {
  from: string; // tz hotel iso string
  to: string; // tz hotel iso string
  unitGroups: {
    unitGroup: ApaleoUnitGroupDto;
    physicalCount: number;
    houseCount: number;
    soldCount: number;
    occupancy: number;
    availableCount: number;
    sellableCount: number;
    allowedOverbookingCount: number;
    maintenance: {
      outOfService: number;
      outOfOrder: number;
      outOfInventory: number;
    };
    block: {
      definite: number;
      tentative: number;
      picked: number;
      remaining: number;
    };
  }[];
}

// Response DTOs for API responses
export interface ApaleoApiResponse<T> {
  data: T[];
  count: number;
}

export interface ApaleoUnitGroupListResponseDto extends ApaleoApiResponse<ApaleoUnitGroupDto> {}

export interface ApaleoUnitsListResponseDto extends ApaleoApiResponse<ApaleoUnitListResponseDto> {}

export interface ApaleoRatePlanListResponseDto extends ApaleoApiResponse<ApaleoRatePlanDto> {}

export interface ApaleoServiceListResponseDto extends ApaleoApiResponse<ApaleoServiceDto> {}

export interface ApaleoAvailabilityListResponseDto
  extends ApaleoApiResponse<ApaleoAvailabilityDto> {}

export interface ApaleoRatePlanPricingListResponseDto
  extends ApaleoApiResponse<ApaleoRatePlanPricingDto> {}

export interface ApaleoPropertiesResponseDto extends ApaleoApiResponse<ApaleoPropertyDto> {}

// Supporting interfaces for ApaleoReservationListResponseDto
export interface ApaleoReservationPropertyDto {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface ApaleoReservationRatePlanDto {
  id: string;
  code: string;
  name: string;
  description: string;
  isSubjectToCityTax: boolean;
}

export interface ApaleoReservationUnitGroupDto {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
}

export interface ApaleoReservationUnitDto {
  id: string;
  name: string;
  description: string;
  unitGroupId: string;
}

export interface ApaleoReservationAmountDto {
  amount: number;
  currency: string;
}

export interface ApaleoReservationAddressDto {
  addressLine1: string;
  postalCode: string;
  city: string;
  countryCode: string;
}

export interface ApaleoReservationVehicleRegistrationDto {
  number: string;
  countryCode: string;
}

export interface ApaleoReservationGuestDto {
  title: string;
  gender: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  email: string;
  phone: string;
  address: ApaleoReservationAddressDto;
  vehicleRegistration?: ApaleoReservationVehicleRegistrationDto;
  preferredLanguage?: string;
}

export interface ApaleoReservationFeeDto {
  id: string;
  code: string;
  name: string;
  description: string;
  dueDateTime?: string;
  fee: ApaleoReservationAmountDto;
}

export interface ApaleoReservationTimeRangeDto {
  from: string;
  to: string;
}

export interface ApaleoReservationAssignedUnitDto {
  unit: ApaleoReservationUnitDto;
  timeRanges: ApaleoReservationTimeRangeDto[];
}

export interface ApaleoReservationBaseAmountDto {
  grossAmount: number;
  netAmount: number;
  vatType: string;
  vatPercent: number;
  currency: string;
}

export interface ApaleoReservationActionReasonDto {
  code: string;
  message: string;
}

export interface ApaleoReservationPaymentAccountDto {
  accountNumber: string;
  accountHolder: string;
  expiryMonth: string;
  expiryYear: string;
  paymentMethod: string;
  payerEmail: string;
  isVirtual: boolean;
  isActive: boolean;
}

export interface ApaleoReservationCompanyDto {
  id: string;
  code: string;
  name: string;
  canCheckOutOnAr: boolean;
}

export interface ApaleoReservationValidationMessageDto {
  category: string;
  code: string;
  message: string;
}

export interface ApaleoReservationCommissionDto {
  commissionAmount: ApaleoReservationAmountDto;
  beforeCommissionAmount: ApaleoReservationAmountDto;
}

export interface ApaleoReservationExternalReferencesDto {
  globalDistributionSystemId?: string;
  onlineTravelAgencyId?: string;
  onlineBookingToolId?: string;
  channelManagerId?: string;
  centralReservationSystemId?: string;
  legacyId?: string;
}

export interface ApaleoReservationServiceDto {
  id: string;
  code: string;
  name: string;
  description: string;
  pricingUnit: 'Room' | 'Person';
  defaultGrossPrice: {
    amount: number;
    currency: string;
  };
}

export interface ApaleoReservationServiceAmountDto {
  grossAmount: number;
  netAmount: number;
  vatType: ApaleoVatType;
  vatPercent: number;
  currency: string;
}

export interface ApaleoReservationServiceDateDto {
  serviceDate: string;
  count: number;
  amount: ApaleoReservationServiceAmountDto;
  isMandatory: boolean;
}

export interface ApaleoReservationServiceItemDto {
  service: ApaleoReservationServiceDto;
  totalAmount: ApaleoReservationServiceAmountDto;
  dates: ApaleoReservationServiceDateDto[];
}

export interface ApaleoReservationIncludedServiceDto {
  service: ApaleoReservationServiceDto;
  serviceDate: string;
  count: number;
  amount: ApaleoReservationBaseAmountDto;
  bookedAsExtra: boolean;
}

export interface ApaleoReservationActionDto {
  action: string;
  isAllowed: boolean;
  reasons?: ApaleoReservationActionReasonDto[];
}

export interface ApaleoReservationTimeSliceDto {
  from: string;
  to: string;
  serviceDate: string;
  ratePlan: ApaleoReservationRatePlanDto;
  unitGroup: ApaleoReservationUnitGroupDto;
  unit: ApaleoReservationUnitDto;
  baseAmount: ApaleoReservationBaseAmountDto;
  totalGrossAmount: ApaleoReservationAmountDto;
  includedServices?: ApaleoReservationIncludedServiceDto[];
  actions?: ApaleoReservationActionDto[];
}

export interface ApaleoReservationDto {
  id: string;
  bookingId: string;
  status: string;
  property: ApaleoReservationPropertyDto;
  ratePlan: ApaleoReservationRatePlanDto;
  unitGroup: ApaleoReservationUnitGroupDto;
  unit: ApaleoReservationUnitDto;
  totalGrossAmount: ApaleoReservationAmountDto;
  arrival: string;
  departure: string;
  created: string;
  modified: string;
  adults: number;
  childrenAges?: number[];
  comment?: string;
  externalCode?: string;
  channelCode: string;
  source?: string;
  primaryGuest: ApaleoReservationGuestDto;
  booker?: ApaleoReservationGuestDto;
  guaranteeType: string;
  cancellationFee: ApaleoReservationFeeDto;
  noShowFee: ApaleoReservationFeeDto;
  balance: ApaleoReservationAmountDto;
  assignedUnits?: ApaleoReservationAssignedUnitDto[];
  timeSlices: ApaleoReservationTimeSliceDto[];
  services: ApaleoReservationServiceItemDto[];
  includedServices: ApaleoReservationIncludedServiceDto[];
  actions?: ApaleoReservationActionDto[];
  allFoliosHaveInvoice: boolean;
  hasCityTax: boolean;
  isPreCheckedIn: boolean;
  paymentAccount?: ApaleoReservationPaymentAccountDto;
  company?: ApaleoReservationCompanyDto;
  corporateCode?: string;
  validationMessages?: ApaleoReservationValidationMessageDto[];
  commission?: ApaleoReservationCommissionDto;
  externalReferences?: ApaleoReservationExternalReferencesDto;
  payableAmount?: {
    guest: ApaleoReservationAmountDto;
  };

  // charges
  cityTaxCharges?: ApaleoFolioChargeDto[];

  taxDetails?: ApaleoReservationTaxDetailDto[];
}

export interface ApaleoReservationTaxDetailDto {
  vatType: ApaleoVatType;
  vatPercent: 0,
  net: {
    amount: number,
    currency: string,
  },
  tax: {
    amount: number,
    currency: string,
  },
}

export interface ApaleoReservationListResponseDto {
  reservations: ApaleoReservationDto[];
  count: number;
}

// Folio DTOs for cityTax mapping
export interface ApaleoFolioChargeAmountDto {
  grossAmount: number;
  netAmount: number;
  vatType: string;
  vatPercent: number;
  currency: string;
}

export interface ApaleoFolioChargeDto {
  id: string;
  serviceType: string;
  name?: string;
  translatedNames?: Record<string, string>;
  isPosted?: boolean;
  serviceDate?: string;
  created?: string;
  amount: ApaleoFolioChargeAmountDto;
  quantity?: number;
  type?: string;
}

export interface ApaleoFolioReservationDto {
  id: string;
}

export interface ApaleoFolioItemDto {
  id: string;
  reservation: ApaleoFolioReservationDto;
  charges?: ApaleoFolioChargeDto[];
  isMainFolio: boolean;
}

export interface ApaleoFolioListResponseDto {
  folios: ApaleoFolioItemDto[];
  count: number;
}

export interface ApaleoCityTaxAmountDto {
  grossAmount: number;
  netAmount: number;
  currency: string;
}

export enum ApaleoStatusEnum {
  Confirmed = 'Confirmed',
  InHouse = 'InHouse',
  CheckedOut = 'CheckedOut',
  Canceled = 'Canceled',
  NoShow = 'NoShow'
}

export enum ApaleoStatusCodeMappingEnum {
  Confirmed = ReservationStatusEnum.CONFIRMED,
  InHouse = ReservationStatusEnum.CONFIRMED,
  CheckedOut = ReservationStatusEnum.COMPLETED,
  Canceled = ReservationStatusEnum.CANCELLED,
  NoShow = ReservationStatusEnum.NO_SHOW
}

export enum ApaleoChannelCodeMappingEnum {
  Ibe = DistributionChannel.GV_SALES_ENGINE,
  ChannelManager = DistributionChannel.SITEMINDER
}

export enum ApaleoGuaranteeTypeMappingEnum {
  CreditCard = HotelPaymentModeCodeEnum.GUAWCC,
  Prepayment = HotelPaymentModeCodeEnum.GUAINV,
  Company = HotelPaymentModeCodeEnum.GUAWDE
}

// Supporting DTOs for ApaleoBookingDto
export class ApaleoBookingAddressDto {
  addressLine1: string;
  postalCode: string;
  city: string;
  countryCode: string;
}

export class ApaleoBookingBookerDto {
  title: string;
  gender: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  email: string;
  phone: string;
  address: ApaleoBookingAddressDto;
}

export class ApaleoBookingPaymentAccountDto {
  accountNumber: string;
  accountHolder: string;
  expiryMonth: string;
  expiryYear: string;
  paymentMethod: string;
  payerEmail: string;
  isVirtual: boolean;
  isActive: boolean;
}

export class ApaleoBookingAmountDto {
  amount: number;
  currency: string;
}

export class ApaleoBookingPropertyDto {
  id: string;
  code: string;
  name: string;
  description: string;
}

export class ApaleoBookingRatePlanDto {
  id: string;
  code: string;
  name: string;
  description: string;
  isSubjectToCityTax: boolean;
}

export class ApaleoBookingUnitGroupDto {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
}

export class ApaleoBookingFeeDto {
  id: string;
  code: string;
  name: string;
  description: string;
  dueDateTime?: string;
  fee: ApaleoBookingAmountDto;
}

export class ApaleoBookingCompanyDto {
  id: string;
  code: string;
  name: string;
  canCheckOutOnAr: boolean;
}

export class ApaleoBookingExternalReferencesDto {
  globalDistributionSystemId?: string;
  onlineTravelAgencyId?: string;
  onlineBookingToolId?: string;
  channelManagerId?: string;
  centralReservationSystemId?: string;
  legacyId?: string;
}

export class ApaleoBookingReservationDto {
  id: string;
  status: string;
  externalCode?: string;
  channelCode: string;
  arrival: string;
  departure: string;
  adults: number;
  childrenAges?: number[];
  totalGrossAmount: ApaleoBookingAmountDto;
  property: ApaleoBookingPropertyDto;
  ratePlan: ApaleoBookingRatePlanDto;
  unitGroup: ApaleoBookingUnitGroupDto;
  guestComment?: string;
  cancellationFee: ApaleoBookingFeeDto;
  noShowFee: ApaleoBookingFeeDto;
  company?: ApaleoBookingCompanyDto;
  isPreCheckedIn: boolean;
  externalReferences?: ApaleoBookingExternalReferencesDto;
}

export class ApaleoBookingDto {
  id: string;
  booker: ApaleoBookingBookerDto;
  paymentAccount: ApaleoBookingPaymentAccountDto;
  comment?: string;
  bookerComment?: string;
  created: string;
  modified: string;
  reservations: ApaleoBookingReservationDto[];
}

export class ApaleoPatchRatesDto {
  fromDate: string;
  toDate: string;
  pmsRatePlanId: string;
  minLength?: number | undefined;
  maxLength?: number | undefined;
  // minAdv?: number | undefined; // donot support
  // maxAdv?: number | undefined; // donot support
  // minLosThrough?: number | undefined; // donot support
  isCTA: boolean;
  isCTD: boolean;
  isCTS: boolean;
}

export enum ApaleoPatchOperation {
  Replace = 'replace',
  Remove = 'remove'
}

export class ApaleoGetTaxListDto {
  isoCountryCode: string;
  atDate?: string; //If nothing specified, returns the VAT types that are effective for the current date in UTC timezone.
}

export interface ApaleoTaxDto {
  type: string;
  percent: number;
}

export class ApaleoGetCityTaxListDto {
  propertyId: string;
}

export interface ApaleoCityTaxDto {
  id: string;
  code: string;
  name: string;
  description: string;
  propertyId: string;
  type: string;
  taxHandlingType: string;
  value: number;
  vatType: string;
  priority: number;
  includeCityTaxInRateAmount: boolean;
}

export interface ApaleoBlockGroupDto {
  id: string;
  name: string;
}

export interface ApaleoBlockPropertyDto {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface ApaleoBlockRatePlanDto {
  id: string;
  code: string;
  name: string;
  description: string;
  isSubjectToCityTax: boolean;
}

export interface ApaleoBlockUnitGroupDto {
  id: string;
  code: string;
  name: string;
  description: string;
  type: ApaleoType;
}

export interface ApaleoBlockMoneyDto {
  amount: number;
  currency: string;
}

export interface ApaleoBlockMarketSegmentDto {
  id: string;
  code: string;
  name: string;
}

export interface ApaleoBlockTimeSliceAmountDto {
  grossAmount: number;
  netAmount: number;
  vatType: ApaleoVatType;
  vatPercent: number;
  currency: string;
}

export interface ApaleoBlockTimeSliceDto {
  from: string;
  to: string;
  blockedUnits: number;
  pickedUnits: number;
  baseAmount: ApaleoBlockTimeSliceAmountDto;
  totalGrossAmount: ApaleoBlockMoneyDto;
}

export interface ApaleoBlockDto {
  id: string;
  group: ApaleoBlockGroupDto;
  status: 'Tentative' | 'Definite' | 'Canceled';
  property: ApaleoBlockPropertyDto;
  ratePlan: ApaleoBlockRatePlanDto;
  unitGroup: ApaleoBlockUnitGroupDto;
  grossDailyRate: ApaleoBlockMoneyDto;
  from: string;
  to: string;
  pickedReservations: number;
  marketSegment: ApaleoBlockMarketSegmentDto;
  created: string;
  modified: string;
  timeSlices: ApaleoBlockTimeSliceDto[];
}

export interface ApaleoUpdateAvailabilityDto {
  fromDate: string;
  toDate: string;
  allowedOverbooking: number;
}

export interface ApaleoMaintenanceDto {
  id: string;
  unit: {
    id: string;
    name: string;
    description: string;
    unitGroupId: string;
  };
  from: string;
  to: string;
  type: ApaleoMaintenanceType;
  description: string;
}

export interface ApaleoUpdateMaintenanceDto {
  unitId: string;
  from: string;
  to: string;
  type: ApaleoMaintenanceType;
  description?: string;
}

export class ApaleoCompanyDto {
  id?: string;
  code?: string;
  propertyId?: string;
  name?: string;
  invoicingEmail?: string;
  phone?: string;
  taxId?: string;
  additionalTaxId?: string;
  additionalTaxId2?: string;
  address?: ApaleoPersonAddressDto;
  canCheckOutOnAr?: boolean;
  ratePlans?: {
    id?: string;
    code?: string;
    corporateCode?: string;
    name?: string;
  }[];
}

export interface ApaleoFolioDto {
  id: string;
  created: string;
  updated: string;
  type: string;
  debitor: {
    title: string;
    firstName: string;
    name: string;
    address: {
      addressLine1: string;
      postalCode: string;
      city: string;
      countryCode: string;
    };
    company: {
      name: string;
      taxId: string;
      additionalTaxId: string;
      additionalTaxId2: string;
    };
    personalTaxId: string;
    reference: string;
    phone: string;
  };
  reservation: {
    id: string;
    bookingId: string;
  };
  property: {
    id: string;
  };
  charges: {
    id: string;
    serviceType: string;
    name: string;
    isPosted: boolean;
    serviceDate: string;
    created: string;
    movedFrom: {
      id: string;
    };
    movedTo: {
      id: string;
    };
    amount: {
      grossAmount: number;
      netAmount: number;
      vatType: string;
      vatPercent: number;
      currency: string;
    };
    quantity: number;
    type: string;
  }[];
  transitoryCharges: {
    id: string;
    name: string;
    amount: {
      amount: number;
      currency: string;
    };
    serviceDate: string;
    created: string;
    quantity: number;
  }[];
  payments: {
    id: string;
    method: string;
    amount: {
      amount: number;
      currency: string;
    };
    receipt: string;
    paymentDate: string;
    businessDate: string;
  }[];
  pendingPayments: {
    id: string;
    amount: {
      amount: number;
      currency: string;
    };
  }[];
  allowances: {
    id: string;
    amount: {
      grossAmount: number;
      netAmount: number;
      vatType: string;
      vatPercent: number;
      currency: string;
    };
    reason: string;
    serviceType: string;
    serviceDate: string;
    created: string;
    movedFrom: {
      id: string;
    };
    movedTo: {
      id: string;
    };
    sourceChargeId: string;
  }[];
  balance: {
    amount: number;
    currency: string;
  };
  checkedOutOnAccountsReceivable: boolean;
  isMainFolio: boolean;
  isEmpty: boolean;
  allowedActions: string[];
  allowedPayment: number;
  maximumAllowance: number;
  status: string;
}
