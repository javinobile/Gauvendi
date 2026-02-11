import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import {
  HotelAmenity,
  HotelAmenityAgeCategoryPricingDto,
  PricingUnitEnum,
  SellingTypeEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import {
  CityTaxBreakdownDto,
  DailyRoomRateDto
} from 'src/modules/booking-calculate/dtos/reservation-pricing.dto';

class AmenityDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsNumber()
  count: number | null;
}

class PriorityCategoryCodeDto {
  @IsArray()
  @IsString({ each: true })
  codeList: string[];

  @IsNumber()
  sequence: number;
}

class PhoneInfoDto {
  @IsString()
  phoneCode: string;

  @IsString()
  phoneNumber: string;
}

export class GuestDto {
  @IsOptional()
  @IsUUID()
  id: string | null;

  @IsOptional()
  @IsString()
  firstName: string | null;

  @IsOptional()
  @IsString()
  lastName: string | null;

  @IsOptional()
  @IsEmail()
  emailAddress: string | null;

  @IsOptional()
  @IsString()
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
  @IsBoolean()
  isMainGuest?: boolean;

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
  preferredLanguage: string | null;
}

class PricingDto {
  totalBaseAmount?: number;
  taxAmount?: number;
  cityTaxAmount?: number;
  serviceChargeAmount?: number;
  totalGrossAmount?: number;
  payOnConfirmationAmount?: number;
  payAtHotelAmount?: number;
  currencyCode?: string;
  taxDetailsMap?: Record<string, any>;
  taxAccommodationDetailsMap?: Record<string, any>;
  accommodationTaxAmount?: number;
  accommodationTaxAmountBySetting?: number;
}
class ReservationPricingDto extends PricingDto {
  cityTaxDetails?: CityTaxBreakdownDto[];
  dailyRoomRateList?: DailyRoomRateDto[];
}

class AmenityPricingListDto extends PricingDto {
  hotelAmenityId: string;
  hotelAmenityCode: string;
  hotelAmenityName: string;
  ageCategoryCode?: string | null;
  count?: number;
  extraServiceType?: string;
  includedDates?: string[];
  ageCategoryPricingList?: HotelAmenityAgeCategoryPricingDto[];
  pricingUnit?: PricingUnitEnum;
  sellingType?: SellingTypeEnum;
  linkedAmenityInfoList?: HotelAmenity[];
}

export class ReservationDto {
  @IsNumber()
  adult: number;

  @IsArray()
  @IsNumber({}, { each: true })
  childrenAgeList: number[];

  @IsNumber()
  pets: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AmenityDto)
  amenityList: AmenityDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriorityCategoryCodeDto)
  priorityCategoryCodeList: PriorityCategoryCodeDto[];

  @IsString()
  rfcRatePlanCode: string;

  @IsString()
  stayOptionCode: string;

  @IsString()
  tripPurpose: string;

  @IsString()
  @IsOptional()
  channel?: string;

  reservationPricing: ReservationPricingDto;

  amenityPricingList: AmenityPricingListDto[];

  @IsString()
  roomProductId: string | null;

  @IsString()
  salesPlanId: string | null;

  @IsString()
  arrival: string;

  @IsString()
  departure: string;

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  alternativeUnitIds?: string[];
  paymentTermCode?: string;
  roomUnitId?: string;
}

class BookingInformationDto {
  @IsString()
  hotelCode: string;

  @IsString()
  bookingFlow: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationDto)
  reservationList: ReservationDto[];

  @IsString()
  @IsOptional()
  paymentTermCode?: string;

  @IsString()
  hotelPaymentModeCode: string;

  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ValidateNested()
  @Type(() => GuestDto)
  guestInformation: GuestDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestDto)
  additionalGuestList: GuestDto[];

  @IsOptional()
  @IsString()
  specialRequest: string | null;

  @IsString()
  source: string;

  @ValidateNested()
  @Type(() => GuestDto)
  booker: GuestDto;

  bookingPricing: PricingDto | null;
}

export class CreditCardInformationDto {
  @IsOptional()
  @IsString()
  refPaymentMethodId: string | null;

  @IsOptional()
  @IsString()
  cardHolder: string | null;

  @IsOptional()
  @IsString()
  cardNumber: string | null;

  @IsOptional()
  @IsString()
  cvv: string | null;

  @IsOptional()
  @IsString()
  expiryMonth: string | null;

  @IsOptional()
  @IsString()
  expiryYear: string | null;

  @IsOptional()
  @IsString()
  type: string | null;
}

class LowestPriceOptionDto {
  @IsString()
  roomProductCode: string;

  @IsString()
  salesPlanCode: string;
}

export class RequestBookingDto {
  @ValidateNested()
  @Type(() => BookingInformationDto)
  bookingInformation: BookingInformationDto;

  @IsString()
  @IsOptional()
  paymentProviderCode: string | null;

  @ValidateNested()
  @Type(() => CreditCardInformationDto)
  @IsOptional()
  creditCardInformation?: CreditCardInformationDto;

  @IsString()
  @IsOptional()
  translateTo: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  promoCodeList: string[] | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LowestPriceOptionDto)
  lowestPriceOptionList: LowestPriceOptionDto[];

  @IsString()
  hotelCode: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriorityCategoryCodeDto)
  priorityCategoryCodeList: PriorityCategoryCodeDto[];

  @IsOptional()
  browserIp?: string | null;

  @IsOptional()
  browserInfo?: any;

  @IsOptional()
  origin?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  // Meta Conversion API tracking fields
  @IsOptional()
  @IsString()
  userAgent?: string | null;

  @IsOptional()
  @IsString()
  fbp?: string | null; // Facebook Pixel cookie (_fbp)

  @IsOptional()
  @IsString()
  fbc?: string | null; // Facebook Click ID cookie (_fbc)
}

export class RequestBookingResponseDto {
  booking: Booking;
}

export class RoomAvailabilityDto {
  roomProductId: string;
  roomProductName: string;
  roomProductCode: string;
  isErfcDeduct: boolean;
  roomIds?: string[];
  roomIdsGroup?: { id: string; roomAvailabilityList: any[] }[];
  roomAvailability?: any[];
}

export class CompleteBookingPaymentIntentDto {
  @IsString()
  id: string;

  @IsString()
  paymentProviderCode: string;
}

export class CompleteBookingDto {
  @IsUUID()
  id: string;

  @IsString()
  hotelCode: string;
}

export class CompleteBookingPaymentDto {
  @ValidateNested()
  @Type(() => CompleteBookingDto)
  booking: CompleteBookingDto;

  @ValidateNested()
  @Type(() => CompleteBookingPaymentIntentDto)
  paymentIntent: CompleteBookingPaymentIntentDto;
}

export class ConfirmBookingPaymentDto {
  @IsString()
  propertyCode: string;

  @IsString()
  refPaymentId: string;

  @IsString()
  bookingId: string;
}

export class WSCreatePaymentStatusDto {
  @IsString()
  bookingId: string;
}

export class WSPaymentCompleteDto {
  @IsString()
  bookingId: string;

  @IsBoolean()
  @IsOptional()
  isProposalBooking?: boolean;

  @IsOptional()
  paymentInfo?: any;
}
