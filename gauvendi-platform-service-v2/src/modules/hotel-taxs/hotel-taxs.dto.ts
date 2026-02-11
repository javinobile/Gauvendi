import { OptionalArrayProperty } from '@decorators/array-property.decorator';
import { LanguageCodeEnum, ServiceTypeEnum } from '@enums/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';

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

export class HotelTaxQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @OptionalArrayProperty()
  typeList?: ServiceTypeEnum[];

  @OptionalArrayProperty()
  idList?: string[];

  @OptionalArrayProperty()
  sort?: string[];
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

export class GetHotelTaxDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class DeleteHotelTaxDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class SetDefaultHotelTaxDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  defaultTaxIds?: string[];

  @IsString()
  @IsNotEmpty()
  hotelId: string;
}



export class HotelTaxInputDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  mappingTaxCode?: string;
}
