import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { HotelTrackingTypeEnum } from '../../../core/entities/hotel-tracking-entities/hotel-tracking.entity';

export class HotelTrackingFilterDto {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsEnum(HotelTrackingTypeEnum)
  hotelTrackingType?: HotelTrackingTypeEnum;
}

export class CreateOrUpdateHotelTrackingDto {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsString()
  hotelCode: string;

  @IsEnum(HotelTrackingTypeEnum)
  hotelTrackingType: HotelTrackingTypeEnum;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DeleteHotelTrackingDto {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsString()
  hotelCode: string;

  @IsEnum(HotelTrackingTypeEnum)
  hotelTrackingType: HotelTrackingTypeEnum;
}

// Meta Conversion API specific configuration interface
export interface MetaConversionApiConfig {
  pixelId: string;
  accessToken: string;
  datasetId?: string;
  testEventCode?: string;
  enabled?: boolean;
  eventsConfig?: {
    pageView?: { enabled: boolean };
    viewContent?: { enabled: boolean };
    search?: { enabled: boolean };
    initiateCheckout?: { enabled: boolean };
    purchase?: { enabled: boolean; includeValue?: boolean };
    lead?: { enabled: boolean };
  };
  userDataSettings?: {
    sendEmail?: boolean;
    sendPhone?: boolean;
    sendAddress?: boolean;
    sendName?: boolean;
  };
  consentMode?: 'STRICT' | 'RELAXED' | 'DISABLED';
  deduplicationEnabled?: boolean;
}

export class HotelTrackingResponseDto {
  id: string;
  hotelId: string;
  hotelCode: string;
  hotelTrackingType: HotelTrackingTypeEnum;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
