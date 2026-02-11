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

export class CreateHotelTaxDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;
  
  @IsString()
  @IsNotEmpty()
  code: string;
  
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsNumber()
  @IsNotEmpty()
  value: number;
  
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