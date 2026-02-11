import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { LanguageCodeEnum } from 'src/core/database/entities/base.entity';

export class CalculateReservationPricingInputDto {
  @IsOptional()
  @IsString()
  index?: string;

  // ISO OffsetDateTime, ví dụ: 2024-01-01T12:00:00+07:00
  @IsDateString()
  arrival: string;

  @IsDateString()
  departure: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateReservationAmenityInputDto)
  amenityList?: CalculateReservationAmenityInputDto[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  childrenAges?: number[];

  @IsOptional()
  @IsInt()
  adults?: number;

  @IsOptional()
  @IsInt()
  pets?: number;

  @IsOptional()
  @IsString()
  roomProductCode?: string;

  @IsOptional()
  @IsString()
  ratePlanCode?: string;

  @IsOptional()
  roomProductId?: string;

  @IsOptional()
  ratePlanId?: string;

  @IsOptional()
  @IsInt()
  allocatedChildren?: number;

  @IsOptional()
  @IsInt()
  allocatedAdults?: number;

  @IsOptional()
  @IsInt()
  allocatedExtraChildren?: number;

  @IsOptional()
  @IsInt()
  allocatedExtraAdults?: number;

  @IsOptional()
  @IsInt()
  allocatedPets?: number;
}

export class CalculateReservationAmenityInputDto {
  @IsOptional()
  count?: number;

  @IsString()
  @IsOptional()
  code?: string;
}

export class CalculateBookingPricingInputDto {
  @IsString()
  @IsOptional()
  hotelCode?: string;

  @IsUUID('4')
  @IsOptional()
  hotelId?: string;

  @IsOptional()
  @IsEnum(LanguageCodeEnum)
  translateTo?: LanguageCodeEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateReservationPricingInputDto)
  reservations: CalculateReservationPricingInputDto[];

  @IsOptional()
  @IsBoolean()
  isCityTaxIncluded?: boolean;
}
