import { ArrayProperty, OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { AmenityTypeEnum, AmenityStatusEnum, PricingUnitEnum, IsePricingDisplayModeEnum, SellingTypeEnum, AmenityAvailabilityEnum } from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsBoolean, IsEnum, IsDateString } from "class-validator";
import { HotelAmenityPriceInputDto, HotelAmenityTranslationInputDto } from "../pricing/dtos/hotel-extras-pricing.dto";

export class UploadHotelAmenityImageDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsOptional()
  file?: any;

  @IsUUID()
  @IsNotEmpty()
  amenityId: string;
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
  @IsEnum(AmenityAvailabilityEnum)
  availability?: AmenityAvailabilityEnum;

  @IsOptional()
  @IsBoolean()
  isSellableOnIbe?: boolean;

  @IsOptional()
  @IsEnum(PricingUnitEnum)
  pricingUnit?: PricingUnitEnum;

  @IsOptional()
  @IsEnum(SellingTypeEnum)
  sellingType?: SellingTypeEnum;

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
}

export class DeleteHotelAmenityDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
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

  @IsBoolean()
  @IsOptional()
  isExclLinkedAmenity?: boolean;

  @OptionalArrayProperty()
  @Type(() => ProductListQueryDto)
  productList: ProductListQueryDto[];
}
