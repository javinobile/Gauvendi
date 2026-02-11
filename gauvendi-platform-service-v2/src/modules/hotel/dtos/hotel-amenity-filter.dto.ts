import {
  AmenityStatusEnum,
  AmenityTypeEnum,
  DistributionChannelEnum,
  IsePricingDisplayModeEnum,
  PricingUnitEnum,
  SellingTypeEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { Filter } from 'src/core/dtos/common.dto';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID
} from 'class-validator';
import { OptionalArrayProperty } from '@src/core/decorators/array-property.decorator';
import { Type } from 'class-transformer';
import { AmenityAvailabilityEnum, DistributionChannel } from '@src/core/enums/common';

export class HotelAmenityFilterDto extends Filter {
  hotelId?: string;

  ids?: string[];

  idList?: string[];

  distributionChannelList?: DistributionChannelEnum[];

  statusList?: AmenityStatusEnum[];

  amenityType?: AmenityTypeEnum;

  sellingTypeList?: SellingTypeEnum[];

  codeList?: string[];
}

export class HotelAmenityPriceInputDto {
  @IsUUID()
  hotelAgeCategoryId?: string;

  @IsOptional()
  price?: number;
}

export class HotelAmenityTranslationInputDto {
  @IsNotEmpty()
  languageCode: string;

  @IsString()
  name: string;

  @IsOptional()
  description?: string;
}

export class HotelAmenityInputDto {
  @IsUUID()
  hotelId: string;

  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(AmenityAvailabilityEnum)
  availability?: AmenityAvailabilityEnum;

  @IsOptional()
  @IsString()
  mappingHotelAmenityCode?: string;

  @IsOptional()
  @IsEnum(AmenityTypeEnum)
  amenityType?: AmenityTypeEnum;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AmenityStatusEnum)
  status?: AmenityStatusEnum;

  @IsOptional()
  @IsBoolean()
  isSellableOnIbe?: boolean;

  @IsOptional()
  @IsEnum(PricingUnitEnum)
  pricingUnit?: PricingUnitEnum;

  @IsOptional()
  @IsEnum(IsePricingDisplayModeEnum)
  isePricingDisplayMode?: IsePricingDisplayModeEnum;

  @OptionalArrayProperty()
  @Type(() => HotelAmenityPriceInputDto)
  hotelAmenityPriceList?: HotelAmenityPriceInputDto[];

  @OptionalArrayProperty()
  @Type(() => HotelAmenityTranslationInputDto)
  translationList?: HotelAmenityTranslationInputDto[];

  @OptionalArrayProperty()
  @IsOptional()
  linkedAmenityCode?: string[];

  @IsOptional()
  @IsEnum(SellingTypeEnum)
  sellingType?: SellingTypeEnum;
}

export class ProductListQueryDto {
  @IsDateString()
  @IsNotEmpty()
  arrival: string;

  @IsDateString()
  @IsNotEmpty()
  departure: string;

  @IsString()
  @IsNotEmpty()
  roomProductId: string;

  @IsString()
  @IsNotEmpty()
  salesPlanId: string;
}

export class GetCppExtrasServiceListQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  isExclLinkedAmenity?: boolean;

  @OptionalArrayProperty()
  @Type(() => ProductListQueryDto)
  productList: ProductListQueryDto[];
}

export class UploadHotelAmenityImageDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsNotEmpty()
  file: any;

  @IsUUID()
  @IsNotEmpty()
  amenityId: string;
}

export class DeleteHotelAmenityDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class HotelAmenityFilter {
  hotelId?: string;

  idList?: string[];

  codeList?: string[];

  statusList?: AmenityStatusEnum[];

  distributionChannelList?: DistributionChannel[];
}
