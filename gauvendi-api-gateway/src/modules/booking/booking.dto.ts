import { ArrayProperty, OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Filter } from "@src/core/dtos/common.dto";
import { Type } from "class-transformer";
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

export class AmenityList {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsOptional()
  count?: number;
}
export class ReservationDto {
  @IsNumber()
  @IsNotEmpty()
  adults: number;

  @ArrayProperty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AmenityList)
  amenityList?: AmenityList[];

  @IsDateString()
  @IsNotEmpty()
  arrival: string;

  @IsDateString()
  @IsNotEmpty()
  departure: string;

  @ArrayProperty()
  @IsOptional()
  @IsNumber({}, { each: true })
  childrenAgeList?: number[];

  @IsString()
  @IsOptional()
  index?: string;

  @IsUUID()
  @IsOptional()
  ratePlanId?: string;

  @IsUUID()
  @IsOptional()
  rfcId?: string;

  @IsNumber()
  @IsOptional()
  pets?: number;
}

export class CalculatePricingDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReservationDto)
  reservationList: ReservationDto[];
}

export class BookingFilterDto extends Filter {
  @OptionalArrayProperty()
  @IsOptional()
  bookingMappingCodes?: string[];

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsString()
  bookingNumber?: string;
}

export class UpdateBookingBookerInfoDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
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
  @IsOptional()
  address?: string;

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
