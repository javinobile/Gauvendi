import { Optional } from "@nestjs/common";
import { Filter } from "@src/core/dtos/common.dto";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ArrayProperty, OptionalArrayProperty } from "src/core/decorators/array-property.decorator";
import {
  AmenityAvailabilityEnum,
  AmenityStatusEnum,
  AmenityTypeEnum,
  DistributionChannelEnum,
  IsePricingDisplayModeEnum,
  PricingUnitEnum,
  SellingTypeEnum,
  Translation,
} from "src/core/enums/common.enum";
export class HotelExtrasListPricingFilterDto extends Filter {
  @IsNotEmpty()
  @IsUUID("4")
  hotelId: string;

  @OptionalArrayProperty()
  distributionChannelList?: DistributionChannelEnum[];

  @OptionalArrayProperty()
  statusList?: AmenityStatusEnum[];

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null && value !== "null" && value !== "" ? (value.toUpperCase() as AmenityTypeEnum) : undefined))
  amenityType?: AmenityTypeEnum;

  @OptionalArrayProperty()
  sellingTypeList?: SellingTypeEnum[];

  @OptionalArrayProperty()
  ids?: string[];

  @IsBoolean()
  @IsOptional()
  isExclLinkedAmenity?: boolean;
}

export class HotelExtrasListPricingResponseDto {
  id: string;
  name: string;
  code: string;
  description: string;
  baseRate: string;
  amenityType: AmenityTypeEnum;
  pricingUnit: PricingUnitEnum;
  iconImageUrl: string;
  displaySequence: number;
  availability: AmenityAvailabilityEnum;
  postNextDay: boolean;
  totalGrossAmount: number;
  mappingHotelAmenityCode: string;
  translationList: Translation[];
  status: AmenityStatusEnum;
  isePricingDisplayMode: IsePricingDisplayModeEnum;
  distributionChannelList: DistributionChannelEnum[];
  linkedAmenityList: string[];
  hotelAmenityPrices: {
    id: string;
    hotelAmenityId: string;
    hotelAgeCategoryId: string;
    price: number;
  }[];
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
