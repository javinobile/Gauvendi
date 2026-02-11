import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { CreditCardInformationDto } from "../../room-product/dtos/booking-information.dto";

// Enums
export enum CppBookingConfirmationType {
  PROPOSE = "PROPOSE",
  RESERVE = "RESERVE",
  CONFIRM = "CONFIRM",
  QUOTE = "QUOTE",
}

export enum CppBookingFlow {
  EXTRANET = "EXTRANET",
  CALL_PRO_PLUS = "CALL_PRO_PLUS",
}

export enum CppChannel {
  DIRECT = "DIRECT",
  OTA = "OTA",
}

export enum CppSource {
  WEBSITE = "WEBSITE",
  MOBILE = "MOBILE",
  PHONE = "PHONE",
}

export enum CppStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum CppSalesPlanType {
  ROOM_ONLY = "ROOM_ONLY",
  BREAKFAST_INCLUDED = "BREAKFAST_INCLUDED",
  HALF_BOARD = "HALF_BOARD",
  FULL_BOARD = "FULL_BOARD",
}

class PhoneInfoDto {
  @IsString()
  @IsOptional()
  phoneCode?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class GuestDto {
  @IsOptional()
  @IsString()
  firstName: string | null;

  @IsOptional()
  @IsString()
  lastName: string | null;

  @IsOptional()
  @IsEmail()
  emailAddress: string | null;

  @IsString()
  @IsOptional()
  countryId: string | null;

  @IsOptional()
  @IsString()
  city: string | null;

  @IsOptional()
  @IsString()
  state: string | null;

  @IsOptional()
  @IsString()
  postalCode: string | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PhoneInfoDto)
  phoneInfo: PhoneInfoDto | null;

  @IsOptional()
  @IsString()
  address: string | null;

  @IsOptional()
  @IsBoolean()
  isBooker?: boolean;

  @IsOptional()
  @IsNumber()
  reservationIdx?: number;

  @IsOptional()
  @IsBoolean()
  isAdult?: boolean;

  // Company info (nullable)
  @IsOptional()
  @IsString()
  companyEmail: string | null;

  @IsOptional()
  @IsString()
  companyAddress: string | null;

  @IsOptional()
  @IsString()
  companyCity: string | null;

  @IsOptional()
  @IsString()
  companyCountry: string | null;

  @IsOptional()
  @IsString()
  companyName: string | null;

  @IsOptional()
  @IsString()
  companyPostalCode: string | null;

  @IsOptional()
  @IsString()
  companyTaxId: string | null;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}

// Guest DTO
export class CppGuestInput {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  emailAddress?: string;

  @IsOptional()
  @IsString()
  phoneCode?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isAdult?: boolean;

  @IsOptional()
  @IsString()
  companyTaxId?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsBoolean()
  isReturningGuest?: boolean;

  @IsOptional()
  @IsBoolean()
  isBooker?: boolean;

  @IsOptional()
  @IsBoolean()
  isMainGuest?: boolean;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}

// Credit Card Information DTO

// Extranet Booking Proposal Setting DTO
export class ExtranetBookingProposalSettingInput {
  @IsOptional()
  @IsString()
  propertyCode?: string;

  @IsOptional()
  @IsString()
  bookingNumber?: string;

  @IsOptional()
  @IsString()
  expiredDay?: string;

  @IsOptional()
  @IsNumber()
  expiredHour?: number;

  @IsOptional()
  @IsNumber()
  expiredMinute?: number;
}

// Amenity Date DTO
export class CppCreateReservationAmenityDateInput {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsNumber()
  count?: number;

  @IsOptional()
  @IsNumber()
  totalBaseAmount?: number;

  @IsOptional()
  @IsNumber()
  totalGrossAmount?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  serviceChargeAmount?: number;
}

// Amenity DTO
export class CppCreateReservationAmenityInput {
  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  totalBaseAmount?: number;

  @IsOptional()
  @IsNumber()
  totalGrossAmount?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  serviceChargeAmount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CppCreateReservationAmenityDateInput)
  dateList?: CppCreateReservationAmenityDateInput[];
}

// Time Slice DTO
export class CppCreateReservationTimeSliceInput {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsNumber()
  adults?: number;

  @IsOptional()
  @IsNumber()
  children?: number;

  @IsOptional()
  @IsNumber()
  extraAdults?: number;

  @IsOptional()
  @IsNumber()
  extraChildren?: number;

  @IsOptional()
  @IsNumber()
  totalBaseAmount?: number;

  @IsOptional()
  @IsNumber()
  totalGrossAmount?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  serviceChargeAmount?: number;
}

// Hotel Tax DTO
export class ReservationHotelTaxInput {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;
}

// City Tax Detail DTO
export class CityTaxDetailInput {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  chargeMethod?: string;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;
}

// Create Reservation DTO
export class CppCreateReservationInput {
  @IsOptional()
  @IsString()
  index?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsDateString()
  arrival: string;

  @IsDateString()
  departure: string;

  @IsOptional()
  @IsEnum(CppBookingFlow)
  bookingFlow?: CppBookingFlow;

  @IsOptional()
  @IsEnum(CppChannel)
  channel?: CppChannel;

  @IsOptional()
  @IsEnum(CppSource)
  source?: CppSource;

  @IsOptional()
  @IsEnum(CppStatus)
  status?: CppStatus;

  @IsOptional()
  @IsString()
  bookingLanguage?: string;

  @IsUUID()
  salesPlanId: string;

  @IsOptional()
  @IsEnum(CppSalesPlanType)
  salesPlanType?: CppSalesPlanType;

  @IsOptional()
  @IsUUID()
  roomProductId?: string;

  @IsOptional()
  @IsNumber()
  adults?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  childrenAgeList?: number[];

  @IsOptional()
  @IsNumber()
  pets?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CppGuestInput)
  primaryGuest?: CppGuestInput;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CppGuestInput)
  additionalGuestList?: CppGuestInput[];

  @IsOptional()
  @IsNumber()
  totalBaseAmount?: number;

  @IsOptional()
  @IsNumber()
  totalGrossAmount?: number;

  @IsOptional()
  @IsNumber()
  totalTaxAmount?: number;

  @IsOptional()
  @IsNumber()
  totalServiceChargeAmount?: number;

  @IsOptional()
  @IsNumber()
  totalCityTaxAmount?: number;

  @IsOptional()
  @IsNumber()
  totalHotelTaxAmount?: number;

  @IsOptional()
  @IsDateString()
  bookingDate?: string;

  @IsOptional()
  @IsDateString()
  releasedDate?: string;

  @IsOptional()
  @IsString()
  cancellationPolicyCode?: string;

  @IsOptional()
  @IsString()
  cancellationPolicyName?: string;

  @IsOptional()
  @IsString()
  cancellationPolicyDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  matchedFeatureCodeList?: string[];

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  paymentTermCode?: string;

  @IsOptional()
  @IsString()
  hotelPaymentModeCode?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsNumber()
  hourPrior?: number;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  guestNote?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardInformationDto)
  creditCardInformation?: CreditCardInformationDto;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  assignedUnitIdList?: string[];

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CppCreateReservationAmenityInput)
  amenityList?: CppCreateReservationAmenityInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CppCreateReservationTimeSliceInput)
  timeSliceList?: CppCreateReservationTimeSliceInput[];

  @IsOptional()
  @IsNumber()
  allocatedChildren?: number;

  @IsOptional()
  @IsNumber()
  allocatedAdults?: number;

  @IsOptional()
  @IsNumber()
  allocatedExtraChildren?: number;

  @IsOptional()
  @IsNumber()
  allocatedExtraAdults?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationHotelTaxInput)
  hotelTaxList?: ReservationHotelTaxInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CityTaxDetailInput)
  cityTaxList?: CityTaxDetailInput[];
}

// Main DTO - CppRequestBookingInput
export class CppRequestBookingInputDto {
  @IsEnum(CppBookingConfirmationType)
  @IsNotEmpty()
  confirmationType: CppBookingConfirmationType;

  @IsString()
  @IsNotEmpty()
  propertyCode: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CppCreateReservationInput)
  reservationList: CppCreateReservationInput[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardInformationDto)
  creditCardInformation?: CreditCardInformationDto;

  @IsString()
  @IsOptional()
  hotelPaymentModeCode?: string;

  @IsString()
  @IsOptional()
  paymentProviderCode?: string;

  @IsOptional()
  @IsString()
  specialRequest?: string;

  @IsOptional()
  @IsString()
  bookingLanguage?: string;

  @IsOptional()
  @IsBoolean()
  isTnCAccepted?: boolean;

  @ValidateNested()
  @Type(() => GuestDto)
  booker: GuestDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExtranetBookingProposalSettingInput)
  bookingProposalSettingInput?: ExtranetBookingProposalSettingInput;
}
