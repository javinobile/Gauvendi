import { HotelConfigurationTypeEnum, PropertyTrackingTypeEnum } from '@src/core/enums/common';
import { IsNotEmpty, IsString, IsObject, IsOptional, IsUUID } from 'class-validator';

export class GetIntegrationDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export class CreateOrUpdateGoogleAnalyticsDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class DeleteGoogleAnalyticsDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export class CreateOrUpdateGoogleTagManagerDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class DeleteGoogleTagManagerDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export class CreateOrUpdateGoogleAdsDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class DeleteGoogleAdsDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export interface MetaConversionMetadata {
  pixelId: string;
  accessToken: string;
  datasetId?: string;
  testEventCode?: string;
  enabled?: boolean;
}

export class CreateOrUpdateMetaConversionDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsObject()
  @IsNotEmpty()
  metadata: MetaConversionMetadata;
}

export class DeleteMetaConversionDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export class PropertyTrackingListDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export class CreateOrUpdatePropertyTrackingDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  propertyTrackingType: PropertyTrackingTypeEnum;
}

export class DeletePropertyTrackingDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  propertyTrackingType: PropertyTrackingTypeEnum;
}

export class GetApaleoIntegrationDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  origin: string;
}
