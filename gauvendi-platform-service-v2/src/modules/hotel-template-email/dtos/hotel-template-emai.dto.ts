import { HotelTemplateEmailCodeEnum } from '@src/core/entities/hotel-entities/hotel-template-email.entity';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class HotelTemplateEmailFilterDto {
  hotelId: string;
  code?: string;
  languageCode?: string;
  codes?: string[];
}

export class HotelTemplateEmailResponseDto {
  id: string;
  titleDynamicFieldList: string[];
  code: string;
  title: string;
  openingSection: string;
  openingSectionDynamicFieldList: string[];
  closingSection: string;
  closingSectionDynamicFieldList: string[];
  signature: string;
  isEnable: boolean;
}

export class UpdateEmailContentInput {
  @IsEnum(HotelTemplateEmailCodeEnum)
  code: HotelTemplateEmailCodeEnum;

  @IsString()
  @IsOptional()
  title?: string;

  @IsUUID()
  id: string;

  @IsUUID()
  @IsOptional()
  closingSection?: string;

  @IsString()
  @IsOptional()
  openingSection?: string;

  @IsBoolean()
  isEnable: boolean;
}

export class EmailTranslationInput {
  @IsEnum(HotelTemplateEmailCodeEnum)
  code: HotelTemplateEmailCodeEnum;

  @IsUUID()
  hotelId: string;
}

export class UpdateEmailTranslationInput {
  @IsUUID()
  id: string;

  @IsString()
  @IsOptional()
  openingSection?: string;

  @IsString()
  @IsOptional()
  closingSection?: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class MigrateTemplateEmailTranslationInput {
  @IsUUID()
  hotelId: string;
}
