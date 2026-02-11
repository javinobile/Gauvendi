import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import {
  RequestBookingDto,
  RoomAvailabilityDto
} from 'src/modules/booking/dtos/request-booking.dto';

export class AmountDto {
  @IsString()
  Currency: string;

  @IsNumber()
  GrossValue: number;

  @IsArray()
  @IsString({ each: true })
  TaxCodes: string[];
}

export class PersonCountDto {
  @IsString()
  AgeCategoryId: string;

  @IsNumber()
  Count: number;
}

export class TimeUnitPriceDto {
  @IsNumber()
  Index: number;

  @ValidateNested()
  @Type(() => AmountDto)
  Amount: AmountDto;
}

export class ProductOrderDto {
  @IsString()
  ProductId: string;

  @IsDateString()
  StartUtc?: string;

  @IsDateString()
  EndUtc?: string;

  @IsNumber()
  Count?: number;
}

export enum ReservationState {
  CONFIRMED = 'Confirmed',
  OPTIONAL = 'Optional',
  ENQUIRED = 'Enquired',
  CANCELED = 'Canceled'
}

export class ReservationDto {
  @IsString()
  Identifier: string;

  @IsEnum(ReservationState)
  State: ReservationState;

  @IsDateString()
  StartUtc: string;

  @IsDateString()
  EndUtc: string;

  @IsOptional()
  @IsDateString()
  ReleasedUtc?: string | null;

  @IsString()
  CustomerId: string;

  @IsString()
  BookerId: string;

  @IsString()
  RequestedCategoryId: string;

  @IsString()
  RateId: string;

  @IsOptional()
  @IsString()
  TravelAgencyId?: string | null;

  @IsOptional()
  @IsString()
  CompanyId?: string | null;

  @IsOptional()
  @IsString()
  Notes?: string | null;

  @IsOptional()
  @IsNumber()
  TimeUnitAmount?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonCountDto)
  PersonCounts: PersonCountDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeUnitPriceDto)
  @IsOptional()
  TimeUnitPrices?: TimeUnitPriceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOrderDto)
  ProductOrders?: ProductOrderDto[];

  @IsOptional()
  @IsString()
  AvailabilityBlockId?: string | null;

  @IsOptional()
  @IsString()
  VoucherCode?: string | null;
}

export class ReservationsCreateInput {
  @IsString()
  ClientToken: string;

  @IsString()
  AccessToken: string;

  @IsString()
  Client: string;

  @IsString()
  PropertyId: string;

  @IsString()
  ServiceId: string | null;

  @IsOptional()
  @IsString()
  GroupId?: string | null;

  @IsOptional()
  @IsString()
  GroupName?: string | null;

  @IsBoolean()
  SendConfirmationEmail: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationDto)
  Reservations: ReservationDto[];
}

export class ReservationsCreateMewsInput {
  bookingInput: RequestBookingDto;
  booking: Booking;
  connector: Connector | null;
  booker: Guest;
  roomProductList: RoomAvailabilityDto[];
}
