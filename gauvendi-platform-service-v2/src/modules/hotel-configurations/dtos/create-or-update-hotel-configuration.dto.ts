import { HotelConfigurationTypeEnum } from '@src/core/enums/common';
import { IsNotEmpty, IsString, IsObject, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateOrUpdateHotelConfigurationDto {
  @IsEnum(HotelConfigurationTypeEnum)
  @IsNotEmpty()
  configType: HotelConfigurationTypeEnum;

  @IsObject()
  @IsNotEmpty()
  configValue: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class CreateOrUpdateAccessibilityIntegrationDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  integration: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class DeleteAccessibilityIntegrationDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  integration: string;
}
