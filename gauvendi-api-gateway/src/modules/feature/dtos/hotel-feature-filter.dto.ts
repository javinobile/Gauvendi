import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { FeatureTypeEnum, HotelRetailFeatureStatusEnum } from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

// Nested DTOs (simplified versions)
export class HotelRetailCategoryDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  displaySequence: number;
}

export class HotelRetailFeatureImageDto {
  @IsUUID()
  id: string;

  @IsString()
  imageUrl: string;

  @IsString()
  imageType: string;
}

export class DailySellingRateDto {
  @IsString()
  date: string;

  @IsNumber()
  rate: number;

  @IsString()
  currency: string;
}

export class DailyRateUnit {
  @IsString()
  date: string;

  @IsNumber()
  rate: number;

  @IsString()
  unit: string;
}

export class HotelRetailFeatureTranslationDto {
  @IsString()
  languageCode: string;

  @IsString()
  name: string;

  @IsString()
  description: string;
}

export class HotelTagDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  code: string;
}

export class RoomDto {
  @IsUUID()
  id: string;

  @IsString()
  roomNumber: string;

  @IsString()
  roomType: string;
}

export class RfcDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  code: string;
}

export class HotelFeatureFilterDto {
  @IsOptional()
  @IsUUID()
  hotelId: string;

  @IsOptional()
  @IsUUID("4", { each: true })
  @OptionalArrayProperty()
  idList?: string[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  retailFeatureCodeList?: string[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  standardFeatureCodeList?: string[];

  @IsOptional()
  @IsUUID("4", { each: true })
  @OptionalArrayProperty()
  hotelRetailCategoryIdList?: string[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  retailCategoryCodeList?: string[];

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsNumber()
  fromTime?: number;

  @IsOptional()
  @IsNumber()
  toTime?: number;

  @IsOptional()
  @IsString()
  featureType?: string;

  @IsOptional()
  @IsEnum(FeatureTypeEnum, { each: true })
  @OptionalArrayProperty()
  typeList?: FeatureTypeEnum[];

  @IsOptional()
  @IsEnum(HotelRetailFeatureStatusEnum, { each: true })
  @OptionalArrayProperty()
  statusList?: HotelRetailFeatureStatusEnum[];

  @IsOptional()
  @IsBoolean()
  isMultiBedroom?: boolean;

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  languageCodeList?: string[];

  @IsOptional()
  @IsString()
  translateTo?: string;

  @IsOptional()
  @IsString()
  measurementUnit?: string;

  @OptionalArrayProperty()
  updateFields?: string[];
}

export class HotelRetailFeatureDto {
  @IsUUID()
  id: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsNumber()
  baseRate: number;

  @IsNumber()
  baseWeight: number;

  @IsEnum(FeatureTypeEnum)
  type: FeatureTypeEnum;

  @IsString()
  description: string;

  @IsString()
  shortDescription: string;

  @IsNumber()
  quantity: number;

  @IsUUID()
  hotelRetailCategoryId: string;

  @IsNumber()
  displaySequence: number;

  @ValidateNested()
  @Type(() => HotelRetailCategoryDto)
  hotelRetailCategory: HotelRetailCategoryDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelRetailFeatureImageDto)
  retailFeatureImageList: HotelRetailFeatureImageDto[];

  @IsBoolean()
  isVisible: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailySellingRateDto)
  dailySellingRateList: DailySellingRateDto[];

  @IsEnum(HotelRetailFeatureStatusEnum)
  status: HotelRetailFeatureStatusEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyRateUnit)
  dailyRateUnitList: DailyRateUnit[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelRetailFeatureTranslationDto)
  translationList: HotelRetailFeatureTranslationDto[];

  @IsArray()
  @IsString({ each: true })
  travelTag: string[];

  @IsArray()
  @IsString({ each: true })
  occasion: string[];

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => HotelTagDto)
  // travelTagList: HotelTagDto[];

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => HotelTagDto)
  // occasionList: HotelTagDto[];

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => RoomDto)
  // assignedRoomList: RoomDto[];

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => RfcDto)
  // assignedRfcList: RfcDto[];

  @IsBoolean()
  isMultiBedroom: boolean;

  @IsBoolean()
  matched: boolean = true;

  @IsString()
  iconImageUrl: string;

  @IsString()
  measurementUnit: string;
}
