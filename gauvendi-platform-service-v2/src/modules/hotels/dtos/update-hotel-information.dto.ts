import { HotelConfigurationTypeEnum, HotelStatusEnum, MeasureMetricEnum } from '@enums/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

export class HotelConfigurationUrlDto {
  @IsEnum(HotelConfigurationTypeEnum)
  @IsOptional()
  configType?: HotelConfigurationTypeEnum;

  @IsString()
  @IsOptional()
  defaultUrl?: string;

  @IsString()
  @IsOptional()
  englishUrl?: string;

  @IsString()
  @IsOptional()
  germanUrl?: string;

  @IsString()
  @IsOptional()
  spanishUrl?: string;

  @IsString()
  @IsOptional()
  italianUrl?: string;

  @IsString()
  @IsOptional()
  frenchUrl?: string;

  @IsString()
  @IsOptional()
  arabicUrl?: string;

  @IsString()
  @IsOptional()
  dutchUrl?: string;
}

export class HotelConfigurationTimeSliceDto {
  @IsString()
  @IsOptional()
  CI?: string;

  @IsString()
  @IsOptional()
  CO?: string;
}

export class UpdateHotelInformationBodyDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(HotelStatusEnum)
  @IsOptional()
  status?: HotelStatusEnum;

  @IsBoolean()
  @IsOptional()
  initialSetup?: boolean;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  countryId?: string;

  @IsString()
  @IsOptional()
  baseCurrencyId?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  emailAddressList?: string[];

  @ValidateNested()
  @Type(() => HotelConfigurationUrlDto)
  @IsOptional()
  hotelTermAndConditionUrl?: HotelConfigurationUrlDto;

  @ValidateNested()
  @Type(() => HotelConfigurationUrlDto)
  @IsOptional()
  hotelPrivacyPolicyUrl?: HotelConfigurationUrlDto;

  @ValidateNested()
  @Type(() => HotelConfigurationUrlDto)
  @IsOptional()
  hotelWebsiteUrl?: HotelConfigurationUrlDto;

  @ValidateNested()
  @Type(() => HotelConfigurationUrlDto)
  @IsOptional()
  hotelImpressumUrl?: HotelConfigurationUrlDto;

  @ValidateNested()
  @Type(() => HotelConfigurationTimeSliceDto)
  @IsOptional()
  hotelTimeSliceConfiguration?: HotelConfigurationTimeSliceDto;

  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @IsEnum(MeasureMetricEnum)
  @IsOptional()
  measureMetric?: MeasureMetricEnum;

  @IsBoolean()
  @IsOptional()
  isCityTaxIncludedSellingPrice?: boolean;

  @IsString()
  @IsOptional()
  phoneCode?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  timeZone?: string;

  @IsNumber()
  @IsOptional()
  roomNumber?: number;

  @IsString()
  @IsOptional()
  addressDisplay?: string;

  @IsString()
  @IsOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  longitude?: string;
}
