import { Filter } from '@src/core/dtos/common.dto';
import { GlobalPaymentProviderCodeEnum } from '@src/core/enums/common';

export class GlobalPaymentMethodFilterDto extends Filter {
  hotelId?: string;
  codes?: string[];
  ids?: string[];
}

export interface PaymentProviderDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

export interface PaymentMetadataDto {
  subMerchantId?: string;
  merchant?: string;
  urlPrefix?: string;
  platformBackendOriginKey?: string;
  bookingEngineOriginKey?: string;
  paymentApiKey?: string;
  [key: string]: any;
}

export interface PropertyPaymentMethodSettingDto {
  id: string;
  globalPaymentMethodId: string;
  globalPaymentProviderId: string;
  metadata: {
    value: any | null;
    metadata: PaymentMetadataDto;
  };
  status: string;
}

export class GlobalPaymentMethodResponseDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  supportedPaymentProviderCodeList: string[];
  paymentProviderList: PaymentProviderDto[];
  propertyPaymentMethodSetting: PropertyPaymentMethodSettingDto | null;
}

export class GlobalPaymentMethodDto {
  code: string;
}

export interface ActivateHotelPaymentMethodInputDto {
  globalPaymentMethodId?: string;
  globalPaymentProviderId?: string;
  hotelId?: string;
  propertyCode?: string;
  metadata: {
    value: any | null;
    metadata: PaymentMetadataDto;
  };
}

export interface DeactivateHotelPaymentMethodInputDto {
  hotelPaymentMethodSettingId: string;
  hotelId: string;
}

export interface GeneratePaymentOnboardingUrlInputDto {
  hotelId: string;
  paymentProviderCode: GlobalPaymentProviderCodeEnum;
  accountType: 'standard' | 'advanced';
  countryCode: string;
  returnUrl: string;
  refreshUrl: string;
}

export class PaymentOnboardingDto {
  accountId: string;
  link: string;
  href: string;
  hmacKey: string;
}

export interface PayPalMerchantOnboardingStatusDto {
  primaryEmailConfirmed?: boolean | null;
  paymentsReceivable?: boolean | null;
  oauthIntegrationList?: any[] | null;
}

