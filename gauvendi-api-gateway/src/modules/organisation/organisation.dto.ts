export class OrganizationListDto {}

import { TaxSettingEnum } from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";

export class CreateHotelDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  status: string;

  @IsArray()
  @IsString({ each: true })
  emailAddress: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  phoneCountryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsUUID()
  languageCode?: string;

  @IsOptional()
  @IsEnum(TaxSettingEnum)
  taxSetting?: TaxSettingEnum;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}

export class AssignUsersDto {
  @IsArray()
  @IsUUID("4", { each: true })
  @Type(() => String)
  userIds: string[];
}

export class AssignToHotelDto {
  @IsNotEmpty()
  @IsUUID()
  productId: string;
}

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  phoneCountryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;
}

export class CreateOrganizationWithHotelsDto extends CreateOrganizationDto {
  @IsNotEmpty()
  @Type(() => CreateHotelDto)
  hotel: CreateHotelDto;
}
