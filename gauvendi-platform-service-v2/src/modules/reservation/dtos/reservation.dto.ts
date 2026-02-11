import {
  ArrayProperty,
  OptionalArrayProperty
} from '@src/core/decorators/array-property.decorator';
import { Filter } from '@src/core/dtos/common.dto';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { Company } from '@src/core/entities/booking-entities/company.entity';
import { Guest } from '@src/core/entities/booking-entities/guest.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { ReservationFilterDateType } from '@src/core/enums/common';
import { UpdateBookingBookerInfoDto } from '@src/modules/booking/dtos/booking.dto';
import { RequestBookingDto } from '@src/modules/booking/dtos/request-booking.dto';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { BooleanTransform } from 'src/core/decorators/boolean-transform.decorator';

const nilArrayTransform = (value: string[]) =>
  value?.length ? value.filter((item: string) => item !== 'null' && item !== 'undefined') : null;
const nilTransform = (value: string) => (value === 'null' || value === 'undefined' ? null : value);
export class ReservationManagementFilterDto extends Filter {
  @IsUUID()
  hotelId: string;

  @OptionalArrayProperty()
  @Transform(({ value }) => nilArrayTransform(value))
  statusList?: string[] | null;

  @IsOptional()
  @Transform(({ value }) => nilTransform(value))
  fromDate?: string | null;

  @IsOptional()
  @Transform(({ value }) => nilTransform(value))
  toDate?: string | null;

  @OptionalArrayProperty()
  @Transform(({ value }) => nilArrayTransform(value))
  bookingChannelList?: string[] | null;

  @OptionalArrayProperty()
  @Transform(({ value }) => nilArrayTransform(value))
  bookingFlowList?: string[] | null;

  @OptionalArrayProperty()
  @Transform(({ value }) => nilArrayTransform(value))
  bookingSourceList?: string[] | null;

  @OptionalArrayProperty()
  @Transform(({ value }) => nilArrayTransform(value))
  promoCodeList?: string[] | null;

  @IsOptional()
  @BooleanTransform({
    allowNull: true
  })
  isPmsSync?: boolean | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => nilTransform(value))
  text?: string | null;

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => nilArrayTransform(value))
  reservationNumbers?: string[] | null;

  @IsOptional()
  @IsUUID()
  bookingId?: string | null;

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => nilArrayTransform(value))
  reservationIds?: string[] | null;

  @IsOptional()
  @IsString()
  bookingNumber?: string | null;

  type?: ReservationFilterDateType;
  notInStatusList?: string[] | null;
}

export class ReservationSourceFilterDto extends Filter {
  @IsUUID()
  hotelId: string;
}

export class ReservationChannelFilterDto extends Filter {
  @IsUUID()
  hotelId: string;
}

export interface BookingDto {
  id: string;
  bookingNumber: string | null;
  createdAt: string | null;
}

export interface GuestDto {
  firstName: string | null;
  lastName: string | null;
  emailAddress: string | null;
  phoneNumber: string | null;
}

export interface RoomAvailabilityDto {
  date: string;
  status: string;
}

export interface RoomDto {
  id: string;
  roomNumber: string | null;
  roomAvailabilityList: RoomAvailabilityDto[];
}

export interface ReservationRoomDto {
  room: RoomDto;
}

export interface PaymentMethodDto {
  code?: string | null;
  name?: string | null;
}

export interface ReservationDetailsProductDto {
  id: string;
  name: string;
  code: string;
}

export interface ReservationManagementResponseDto {
  id: string;
  bookingLanguage: string | null;
  payOnConfirmationAmount: number | null;
  promoCodeList: string[] | null;
  booking: BookingDto;
  reservationNumber: string | null;
  primaryGuest: GuestDto | null;
  additionalGuest: GuestDto[];
  roomProduct: ReservationDetailsProductDto | null;
  arrival?: string | null;
  departure?: string | null;
  proposalSetting: any | null;
  adult: number | null;
  children: number | null;
  pets: number | null;
  unitAssigned: string | null;
  reservationRoomList: ReservationRoomDto[];
  isLocked: boolean | null;
  status: string | null;
  totalGrossAmount: number | null;
  totalBaseAmount?: number | null;
  balance: number | null;
  paymentMethod: PaymentMethodDto | null;
  bookingFlow: string | null;
  channel: string | null;
  source: string | null;
  createdDate: string | null;
  updatedDate: string | null;
  isPmsPush: boolean | null;
  isBusiness: boolean | null;
  company: any | null;
  createdAt: string | null;
  ratePlan: ReservationDetailsSalesPlanDto | null;
  cancellationPolicy: ReservationDetailsCancellationPolicyDto | null;
  note: string | null;
  cityTaxAmount: number | null;
  paymentFailed;
}

export interface ReservationDetailsSalesPlanDto {
  id: string;
  code: string;
  name: string;
}

export interface ReservationDetailsPaymentTermDto {
  name: string | null;
  description: string | null;
}

export interface ReservationDetailsCancellationPolicyDto {
  name: string | null;
  code: string | null;
  description: string | null;
}

export interface ReservationDetailsProductDto {
  type: string;
  name: string;
  code: string;
  space: number;
  numberOfBedrooms: number;
  capacityAdult: number | null;
  capacityChildren: number | null;
  capacityDefault: number;
  capacityExtra: number;
  extraBedKid: number;
  extraBedAdult: number;
  maximumKid: number;
  maximumAdult: number;
  maximumPet: number;
}

export interface ReservationDetailsLinkedProductDto {
  name: string;
  code: string;
}

export interface ReservationDetailsFeatureDto {
  name: string;
}

export interface ReservationDetailsHotelRetailCategoryDto {
  name: string;
  displaySequence: number;
}

export interface ReservationDetailsProductFeatureDto {
  name: string;
  displaySequence: number;
  hotelRetailCategory: ReservationDetailsHotelRetailCategoryDto;
}

export interface ReservationDetailsExtraDto {
  name: string;
  count: number;
  amenityType: string;
}

export interface ReservationDetailsRoomAvailabilityDto {
  date: string | null;
  status: string | null;
  isLocked: boolean | null;
}

export interface ReservationDetailsAssignedUnitDto {
  roomNumber?: string | null;
  roomAvailabilityList?: ReservationDetailsRoomAvailabilityDto[];
}

export interface ReservationDetailsResponseDto {
  salesPlan?: ReservationDetailsSalesPlanDto;
  paymentTerm?: ReservationDetailsPaymentTermDto;
  cancellationPolicy?: ReservationDetailsCancellationPolicyDto;
  product?: ReservationDetailsProductDto;
  linkedProductList?: ReservationDetailsLinkedProductDto[];
  matchedFeatureList?: ReservationDetailsFeatureDto[];
  mismatchedFeatureList?: ReservationDetailsFeatureDto[] | null;
  productFeatureList?: ReservationDetailsProductFeatureDto[];
  bookingFlow?: string | null;
  extrasList?: ReservationDetailsExtraDto[];
  assignedUnitList?: ReservationDetailsAssignedUnitDto[];
  isLocked?: boolean | null;
  guestNote?: string | null;
}

export enum DateFilterEnum {
  ARRIVAL = 'Arrival',
  STAY = 'Stay',
  MODIFICATION = 'Modification',
  BOOKING_DATE = 'Creation'
}
export class ReservationPmsFilterDto {
  @IsUUID()
  hotelId: string;

  @IsEnum(DateFilterEnum)
  dateFilter: DateFilterEnum;

  @IsDateString({}, { message: 'fromDate must be a valid ISO8601:2004 date-time string' })
  fromDate: string;

  @IsDateString({}, { message: 'toDate must be a valid ISO8601:2004 date-time string' })
  toDate: string;
}

export class CancelReservationInput {
  bookingId: string;

  hotelId: string;

  reservationNumber: string;
}

export class ReleaseBookingInput {
  bookingId: string;
}

export class SendCancellationReservationEmailDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsNotEmpty()
  reservationId: string;

  @IsString()
  @IsOptional()
  language: string;
}

export class RatePlanDetailsFilterDto extends Filter {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  idList: string[];
}

export class RoomAvailabilityReservationDto {
  roomProductId: string;
  roomProductName: string;
  roomProductCode: string;
  isErfcDeduct: boolean;
  roomIds?: string[];
  roomIdsGroup?: { id: string; roomAvailabilityList: any[] }[];
  roomAvailability?: any[];
}

export class CreateReservationDto {
  bookingInput: RequestBookingDto;
  hotel: Hotel;
  booking: Booking;
  company: Company | null;
  guest: Guest | null;
  timeSlice: { CI: string; CO: string };
  additionalGuestList: Partial<Guest>[][];
  cancelPolicyCodes: Map<string, string | null>;
  roomAvailability: RoomAvailabilityReservationDto[];
}

export class UpdateReservationLockUnitInput {
  @IsString()
  @IsNotEmpty()
  reservationNumber: string;

  @IsNotEmpty()
  isLocked: boolean;

  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export class PushPmsReservationInput {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsNotEmpty()
  reservationId: string;
}

export interface UpdateReservationGuestListInput {
  hotelId: string;
  reservationId: string;
  primaryGuest: UpdateBookingBookerInfoDto;
  additionalGuestList: UpdateBookingBookerInfoDto[];
}
