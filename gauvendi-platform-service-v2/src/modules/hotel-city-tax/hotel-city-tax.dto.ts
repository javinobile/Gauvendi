import { OptionalArrayProperty } from '@decorators/array-property.decorator';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import { CityTaxChargeMethodEnum, CityTaxStatusEnum, CityTaxUnitEnum } from '@enums/common';
import { LanguageCodeEnum } from '@enums/common';

export class HotelCityTaxTranslationDto {
  @IsEnum(LanguageCodeEnum)
  @IsNotEmpty()
  languageCode: LanguageCodeEnum;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Index signature to match Translation interface
  [key: string]: any;
}

export class HotelCityTaxAgeGroupDto {
  @IsNumber()
  @IsNotEmpty()
  fromAge: number;

  @IsNumber()
  @IsNotEmpty()
  toAge: number;

  @IsNumber()
  @IsNotEmpty()
  value: number;
}

export class HotelCityTaxQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @OptionalArrayProperty()
  expand?: string[];

  @OptionalArrayProperty()
  sort?: string[];

  @OptionalArrayProperty()
  idList?: string[];
}

export class CreateHotelCityTaxDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CityTaxUnitEnum)
  @IsNotEmpty()
  unit: CityTaxUnitEnum;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsEnum(CityTaxChargeMethodEnum)
  @IsNotEmpty()
  chargeMethod: CityTaxChargeMethodEnum;

  @IsDateString()
  @IsOptional()
  validFrom: string;

  @IsDateString()
  @IsOptional()
  validTo: string;

  @IsEnum(CityTaxStatusEnum)
  @IsNotEmpty()
  status: CityTaxStatusEnum;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mappingPmsCityTaxCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelCityTaxTranslationDto)
  @IsOptional()
  translationInputList?: HotelCityTaxTranslationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelCityTaxAgeGroupDto)
  @IsOptional()
  ageGroupInputList?: HotelCityTaxAgeGroupDto[];
}

export class UpdateHotelCityTaxDto {
  @IsString()
  @IsNotEmpty()
  id: string;

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
  @Type(() => HotelCityTaxTranslationDto)
  @IsOptional()
  translationInputList?: HotelCityTaxTranslationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelCityTaxAgeGroupDto)
  @IsOptional()
  ageGroupInputList?: HotelCityTaxAgeGroupDto[];
}

export class GetHotelCityTaxDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class DeleteHotelCityTaxDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class HotelCityTaxInputDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  mappingCityTaxCode?: string;
}
