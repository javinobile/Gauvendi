import { Filter } from "@src/core/dtos/common.dto";

// Filter DTO for querying hotel payment method settings
export interface HotelPaymentMethodSettingFilterDto extends Filter {
  hotelId?: string;
}

// Payment provider information
export interface PaymentProviderDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

// Payment method metadata structure
export interface PaymentMethodMetadataDto {
  value: any;
  metadata: any;
}

// Response DTO for hotel payment method settings
export interface HotelPaymentMethodSettingResponseDto {
  globalPaymentMethodId: string;
  propertyPaymentMethodSettingId: string;
  code: string;
  name: string;
  description: string;
  metadata: PaymentMethodMetadataDto;
  paymentProvider: PaymentProviderDto;
}
