import {
  HotelAmenity,
  HotelAmenityAgeCategoryPricingDto
} from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { CityTaxChargeMethodEnum, SellingTypeEnum } from '@src/core/enums/common';
import { GuestDto } from '@src/modules/guest/dtos/guest.dto';
import { PriorityCategoryCodeDto } from '@src/modules/ise-recommendation/ise-recommendation.dto';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

class AmenityDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsNumber()
  count: number | null;
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

  reservationPricing?: ReservationPricingDto;

  amenityPricingList?: AmenityPricingListDto[];

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

  assignedUnitIdList?: string[] | null;

  alternativeUnitIds?: string[] | null;

  paymentTermCode?: string;
  primaryGuest: GuestDto;

  roomUnitId?: string;
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

export interface DailyRoomRateDto {
  date: string;
  baseAmount: number;
  taxAmount: number;
  grossAmount: number;
  baseAmountBeforeAdjustment: number;
  taxAmountBeforeAdjustment: number;
  grossAmountBeforeAdjustment: number;
}

export class CityTaxBreakdownDto {
  id: string;
  code: string;
  name: string;
  amount: number;
  chargeMethod?: CityTaxChargeMethodEnum;
}
class ReservationPricingDto extends PricingDto {
  cityTaxDetails?: CityTaxBreakdownDto[];
  dailyRoomRateList?: DailyRoomRateDto[];
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

export class LowestPriceOptionDto {
  @IsString()
  roomProductCode: string;

  @IsString()
  salesPlanCode: string;
}

class AmenityPricingListDto extends PricingDto {
  hotelAmenityId: string;
  hotelAmenityCode: string;
  hotelAmenityName: string;
  ageCategoryCode?: string | null;
  count?: number;
  pricingUnit?: string;
  extraServiceType?: string;
  ageCategoryPricingList?: HotelAmenityAgeCategoryPricingDto[];
  includedDates?: string[];
  sellingType?: SellingTypeEnum;
  linkedAmenityInfoList?: HotelAmenity[];
}

export interface BookingInformationDto {
  hotelCode: string;
  bookingFlow: string;
  reservationList: ReservationDto[];

  hotelPaymentModeCode?: string;

  currencyCode?: string;
  guestInformation: GuestDto;
  additionalGuestList: GuestDto[];
  specialRequest: string | null;
  source: string;
  booker: GuestDto;

  bookingPricing: PricingDto | null;
}
