import { ArrayProperty, OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Filter } from "@src/core/dtos/common.dto";
import { ReservationFilterDateType } from "@src/core/enums/common.enum";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { BooleanTransform } from "src/core/decorators/boolean-transform.decorator";
import { UpdateBookingBookerInfoDto } from "../booking/booking.dto";

const nilArrayTransform = (value: string[]) => (value?.length ? value.filter((item: string) => item !== "null" && item !== "undefined") : null);
const nilTransform = (value: string) => (value === "null" || value === "undefined" ? null : value);
export class ReservationManagementFilterDto extends Filter {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

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
    allowNull: true,
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

  @IsOptional()
  @IsEnum(ReservationFilterDateType)
  type?: ReservationFilterDateType;
}

export class ReservationSourceFilterDto extends Filter {
  @IsUUID()
  hotelId: string;
}

export class ReservationBookingFlowFilterDto extends Filter {
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
}

export interface GuestDto {
  firstName: string | null;
  lastName: string | null;
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
  name?: string | null;
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
}

export enum DateFilterEnum {
  ARRIVAL = "Arrival",
  STAY = "Stay",
  MODIFICATION = "Modification",
  BOOKING_DATE = "Creation",
}
export class ReservationPmsFilterDto {
  @IsUUID()
  hotelId: string;

  @IsEnum(DateFilterEnum)
  dateFilter: DateFilterEnum;

  @IsDateString({}, { message: "fromDate must be a valid ISO8601:2004 date-time string" })
  fromDate: string;

  @IsDateString({}, { message: "toDate must be a valid ISO8601:2004 date-time string" })
  toDate: string;
}

export class RatePlanDetailsFilterDto extends Filter {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  idList: string[];
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

export class UpdateReservationGuestListInput {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsNotEmpty()
  reservationId: string;

  
  @ValidateNested()
  @Type(() => UpdateBookingBookerInfoDto)
  primaryGuest: UpdateBookingBookerInfoDto;

  @ArrayProperty()
  @ValidateNested({ each: true })
  @Type(() => AdditionalGuestDto)
  additionalGuestList: AdditionalGuestDto[];
}

export class  AdditionalGuestDto {
  @IsOptional()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsNotEmpty()
  lastName: string;

  @IsBoolean()
  @IsOptional()
  isAdult: boolean;
}