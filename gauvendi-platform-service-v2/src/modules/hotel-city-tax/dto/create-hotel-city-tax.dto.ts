import { 
  CityTaxChargeMethodEnum, 
  CityTaxUnitEnum, 
  CityTaxStatusEnum, 
} from "@enums/common";
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsEnum, 
  IsDateString, 
  IsArray, 
  ValidateNested 
} from "class-validator";
import { Type } from "class-transformer";
import { LanguageCodeEnum } from "@enums/common";

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
  @IsNotEmpty()
  validFrom: string;
  
  @IsDateString()
  @IsNotEmpty()
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
