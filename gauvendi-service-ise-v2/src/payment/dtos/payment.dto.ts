import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { GlobalPaymentProviderCodeEnum } from 'src/core/entities/hotel-entities/global-payment-provider.entity';
import { PaymentMethodStatusEnum } from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { HotelPaymentModeCodeEnum } from 'src/core/entities/hotel-entities/hotel-payment-mode.entity';

export enum PropertyPaymentMethodSettingStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// Base filter DTO
export class AvailablePaymentMethodFilterDto {
  @IsNotEmpty({ message: 'Property code is required' })
  @IsString({ message: 'Property code must be a string' })
  @Transform(({ value }) => value?.trim())
  hotelCode?: string;

  @IsNotEmpty({ message: 'Sales plan code list is required' })
  @IsString({ each: true, message: 'Each sales plan code must be a string' })
  @OptionalArrayProperty()
  ratePlanCodes?: string[];

  @IsNotEmpty({ message: 'Arrival date is required' })
  @IsDateString({}, { message: 'Arrival must be a valid ISO date string' })
  fromDate?: string; // ISO date string

  @IsNotEmpty({ message: 'Departure date is required' })
  @IsDateString({}, { message: 'Departure must be a valid ISO date string' })
  toDate?: string; // ISO date string
}

// Global Payment Method DTOs
export class GlobalPaymentMethodDto {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  paymentProviderList?: GlobalPaymentProviderDto[];
}

export class GlobalPaymentProviderDto {
  id?: string;
  code?: GlobalPaymentProviderCodeEnum;
  name?: string;
  description?: string;
}

export class GlobalPaymentMethodFilterDto {
  codeList?: HotelPaymentModeCodeEnum[];
  expand?: string[];
}

// Property Payment Method Setting DTOs
export class PropertyPaymentMethodSettingDto {
  id?: string;
  propertyId?: string;
  globalPaymentMethodId?: string;
  globalPaymentProviderId?: string;
  status?: PaymentMethodStatusEnum;
  metadata?: PropertyPaymentMethodSettingMetadataDto;
}

export class PropertyPaymentMethodSettingMetadataDto {
  metadata?: Record<string, any>;
}

export class PropertyPaymentMethodSettingFilterDto {
  propertyIdList?: string[];
  globalPaymentMethodIdList?: string[];
  statusList?: PaymentMethodStatusEnum[];
}

// Payment Method Details DTO
export class PaymentMethodDetailsDto {
  metadata?: PropertyPaymentMethodSettingMetadataDto;
  paymentProvider?: GlobalPaymentProviderDto;
}

// Available Payment Method DTO (Response)
export class AvailablePaymentMethodDto {
  paymentMethodId?: string;
  paymentMethodCode?: string;
  paymentMethodName?: string;
  paymentMethodDescription?: string;
  paymentMethodDetailsList?: PaymentMethodDetailsDto[];
}

// Hotel Payment Term DTOs
export class HotelPaymentTermDto {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  payOnConfirmation?: number;
  payAtHotel?: number;
  translationList?: HotelPaymentTermTranslationDto[];
}

export class HotelPaymentTermTranslationDto {
  id?: string;
  languageCode?: string;
  name?: string;
  description?: string;
  payAtHotelDescription?: string;
  payOnConfirmationDescription?: string;
}

export class HotelPaymentTermFilterDto {
  hotelId?: string;
  codeList?: string[];
}

// Rate Plan Payment Term Daily DTO
export class RatePlanPaymentTermDailyDto {
  id?: string;
  ratePlanId?: string;
  paymentTermCode?: string;
  hotelId?: string;
  date?: string; // ISO date string
  isAdjusted?: boolean;
}

export class RatePlanPaymentTermDailyFilterDto {
  ratePlanIdList?: string[];
  hotelId?: string;
  idList?: string[];
  fromDate?: string; // ISO date string
  toDate?: string; // ISO date string
}
