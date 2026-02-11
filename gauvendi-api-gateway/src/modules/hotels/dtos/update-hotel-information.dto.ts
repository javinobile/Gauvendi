import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { HotelConfigurationTypeEnum, HotelStatusEnum, MeasureMetricEnum } from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class HotelConfigurationUrlDto {
  @IsEnum(HotelConfigurationTypeEnum)
  @IsOptional()
  configType?: HotelConfigurationTypeEnum;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  defaultUrl?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  englishUrl?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  germanUrl?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  spanishUrl?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  italianUrl?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  frenchUrl?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  arabicUrl?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  dutchUrl?: string;
}

export class UpdateHotelInformationBodyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  code: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  name?: string;

  @IsEnum(HotelStatusEnum)
  @IsOptional()
  @ApiPropertyOptional({ enum: HotelStatusEnum })
  status?: HotelStatusEnum;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  initialSetup?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  city?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  state?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  countryId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  baseCurrencyId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  emailAddressList?: string[];

  @ValidateNested()
  @Type(() => HotelConfigurationUrlDto)
  @IsOptional()
  @ApiPropertyOptional({ type: HotelConfigurationUrlDto })
  hotelTermAndConditionUrl?: HotelConfigurationUrlDto;

  @ValidateNested()
  @Type(() => HotelConfigurationUrlDto)
  @IsOptional()
  @ApiPropertyOptional({ type: HotelConfigurationUrlDto })
  hotelPrivacyPolicyUrl?: HotelConfigurationUrlDto;

  @ValidateNested()
  @Type(() => HotelConfigurationUrlDto)
  @IsOptional()
  @ApiPropertyOptional({ type: HotelConfigurationUrlDto })
  hotelWebsiteUrl?: HotelConfigurationUrlDto;

  @ValidateNested()
  @Type(() => HotelConfigurationUrlDto)
  @IsOptional()
  @ApiPropertyOptional({ type: HotelConfigurationUrlDto })
  hotelImpressumUrl?: HotelConfigurationUrlDto;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  preferredLanguage?: string;

  @IsEnum(MeasureMetricEnum)
  @IsOptional()
  @ApiPropertyOptional({ enum: MeasureMetricEnum })
  measureMetric?: MeasureMetricEnum;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  isCityTaxIncludedSellingPrice?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  phoneCode?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  timeZone?: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  roomNumber?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  addressDisplay?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  longitude?: string;
}
