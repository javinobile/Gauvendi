import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { ArrayProperty } from "src/core/decorators/array-property.decorator";

// Query DTOs
export class GetHotelRetailCategoriesDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class GetHotelRetailFeaturesDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  @IsOptional()
  categoryIds?: string[];

  @ArrayProperty()
  @IsOptional()
  featureIds?: string[];

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isGetAllRoomProductRetailFeatures?: boolean;

  // Pagination
  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  offset?: number;
}

// Update DTOs
export class UpdateRetailFeatureDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsNumber()
  @IsOptional()
  baseWeight?: number;

  @IsNumber()
  @IsOptional()
  baseRate?: number;

  @IsNumber()
  @IsOptional()
  displaySequence?: number;

  @IsBoolean()
  @IsOptional()
  isSuggestedPrice?: boolean;
}

export class BulkUpdateRetailFeaturesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRetailFeatureDto)
  features: UpdateRetailFeatureDto[];
}

export class UpdateCategoryPriceWeightDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @IsNotEmpty()
  priceWeight: number;
}

export class UpdateRetailVisibilityDto {
  @IsUUID()
  @IsNotEmpty()
  featureId: string;

  @IsBoolean()
  @IsNotEmpty()
  isVisible: boolean;
}

// Translation DTOs
export class FeatureTranslationDto {
  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  measurementUnit?: string;
}

export class UpdateRetailInfoDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @IsOptional()
  baseRate?: number;

  @IsNumber()
  @IsOptional()
  baseWeight?: number;

  @IsNumber()
  @IsOptional()
  displaySequence?: number;

  @IsString()
  @IsOptional()
  measurementUnit?: string;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureTranslationDto)
  @IsOptional()
  translations?: FeatureTranslationDto[];
}

export class UpdateStandardInfoDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @IsOptional()
  displaySequence?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureTranslationDto)
  @IsOptional()
  translations?: FeatureTranslationDto[];
}

export class CreateStandardFeatureDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  iconImageUrl: string;
}

export class CreateRetailFeatureDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  iconImageUrl: string;

  @IsString()
  @IsNotEmpty()
  hotelRetailCategoryId: string;
}

export class BulkCreateStandardFeatureDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStandardFeatureDto)
  templates: CreateStandardFeatureDto[];
}

export enum ActionRetailFeatureForEnum {
  ROOM_UNIT = "ROOM_UNIT",
  ROOM_PRODUCT = "ROOM_PRODUCT",
}

export class BulkCreateRetailFeatureDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRetailFeatureDto)
  templates: CreateRetailFeatureDto[];

  @IsEnum(ActionRetailFeatureForEnum)
  @IsOptional()
  createFor?: ActionRetailFeatureForEnum;
}

export class GetStandardFeaturesDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  @IsOptional()
  ids?: string[];

  // Pagination
  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class DeleteRetailFeatureDto {
  @IsEnum(ActionRetailFeatureForEnum)
  @IsOptional()
  actionFor?: ActionRetailFeatureForEnum;
}
