import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { Filter } from 'src/core/dtos/common.dto';
import { HotelAgeCategoryCodeEnum } from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import {
  AmenityStatusEnum,
  AmenityTypeEnum,
  IsePricingDisplayModeEnum,
  PricingUnitEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';

export class HotelAmenityFilterDto extends Filter {
  @IsOptional()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsEnum(AmenityTypeEnum)
  amenityType?: AmenityTypeEnum;

  @IsOptional()
  code?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codes?: string[];

  @IsOptional()
  @IsEnum(AmenityStatusEnum)
  status?: AmenityStatusEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}

export class HotelAgeCategoryDto {
  code?: HotelAgeCategoryCodeEnum;
  name?: string;
  fromAge?: number;
  toAge?: number;
}

export class HotelAmenityPriceDto {
  hotelAgeCategory?: HotelAgeCategoryDto | null;
  price?: number | null;
}

export class HotelAmenityResponseDto {
  id?: string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  amenityType?: AmenityTypeEnum;
  pricingUnit?: PricingUnitEnum;
  iconImageUrl?: string | null;
  totalBaseAmount?: number | null;
  totalGrossAmount?: number | null;
  baseRate?: number | null;
  isePricingDisplayMode?: IsePricingDisplayModeEnum;
  hotelAmenityPriceList?: HotelAmenityPriceDto[];
}
