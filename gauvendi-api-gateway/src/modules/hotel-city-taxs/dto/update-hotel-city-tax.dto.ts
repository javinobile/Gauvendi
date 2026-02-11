import { CityTaxChargeMethodEnum, CityTaxUnitEnum, CityTaxStatusEnum, LanguageCodeEnum } from "@src/core/enums/common.enum";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, IsArray, ValidateNested, IsUUID } from "class-validator";
import { Type } from "class-transformer";

export class HotelCityTaxTranslationUpdateDto {
  @IsEnum(LanguageCodeEnum)
  @IsNotEmpty()
  languageCode: LanguageCodeEnum;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class HotelCityTaxAgeGroupUpdateDto {
  @IsNumber()
  @IsOptional()
  fromAge?: number;

  @IsNumber()
  @IsOptional()
  toAge?: number;

  @IsNumber()
  @IsOptional()
  value?: number;
}

export class UpdateHotelCityTaxDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(CityTaxUnitEnum)
  @IsOptional()
  unit?: CityTaxUnitEnum;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsEnum(CityTaxChargeMethodEnum)
  @IsOptional()
  chargeMethod?: CityTaxChargeMethodEnum;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validTo?: string;

  @IsEnum(CityTaxStatusEnum)
  @IsOptional()
  status?: CityTaxStatusEnum;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mappingPmsCityTaxCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelCityTaxTranslationUpdateDto)
  @IsOptional()
  translationInputList?: HotelCityTaxTranslationUpdateDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelCityTaxAgeGroupUpdateDto)
  @IsOptional()
  ageGroupInputList?: HotelCityTaxAgeGroupUpdateDto[];
}

export class HotelCityTaxInputDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  mappingCityTaxCode?: string;
}
