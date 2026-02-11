import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PropertyTrackingTypeEnum {
  DUETTO = 'DUETTO',
  COOKIEBOT = 'COOKIEBOT',
  USERCENTRICS_CMP = 'USERCENTRICS_CMP',
  META_CONVERSION_API = 'META_CONVERSION_API',
}

export class PropertyTrackingFilterDto {
  @IsOptional()
  @IsString()
  hotelId?: string;

  @IsString()
  propertyCode: string;

  @IsOptional()
  @IsEnum(PropertyTrackingTypeEnum)
  propertyTrackingType?: PropertyTrackingTypeEnum;
}

export class MetaEventsConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class MetaUserDataSettingsDto {
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  sendPhone?: boolean;

  @IsOptional()
  @IsBoolean()
  sendAddress?: boolean;

  @IsOptional()
  @IsBoolean()
  sendName?: boolean;
}

export class MetaConversionApiConfigDto {
  @IsString()
  pixelId: string;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  datasetId?: string;

  @IsOptional()
  @IsString()
  testEventCode?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  eventsConfig?: Record<string, MetaEventsConfigDto>;

  @IsOptional()
  @ValidateNested()
  @Type(() => MetaUserDataSettingsDto)
  userDataSettings?: MetaUserDataSettingsDto;

  @IsOptional()
  @IsString()
  consentMode?: 'STRICT' | 'RELAXED' | 'DISABLED';

  @IsOptional()
  @IsBoolean()
  deduplicationEnabled?: boolean;
}

export class CreateOrUpdatePropertyTrackingDto {
  @IsOptional()
  @IsString()
  hotelId?: string;

  @IsString()
  propertyCode: string;

  @IsEnum(PropertyTrackingTypeEnum)
  propertyTrackingType: PropertyTrackingTypeEnum;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DeletePropertyTrackingDto {
  @IsString()
  propertyCode: string;

  @IsEnum(PropertyTrackingTypeEnum)
  propertyTrackingType: PropertyTrackingTypeEnum;
}

export class PropertyTrackingResponseDto {
  id: string;
  hotelId: string;
  propertyCode: string;
  propertyTrackingType: PropertyTrackingTypeEnum;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
