import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, IsArray, ValidateNested, IsUUID } from "class-validator";
import { Type } from "class-transformer";
import { LanguageCodeEnum } from "@src/core/enums/common.enum";

export class HotelTaxTranslationDto {
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

export class UpdateHotelTaxDto {
  @IsUUID()
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

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validTo?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mappingPmsTaxCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelTaxTranslationDto)
  @IsOptional()
  propertyTaxTranslationInputList?: HotelTaxTranslationDto[];
}

export class HotelTaxInputDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  mappingTaxCode?: string;
}
