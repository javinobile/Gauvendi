import { Filter } from '@src/core/dtos/common.dto';
import { PaymentMethodStatusEnum } from '@src/core/enums/common';

// Filter DTO for querying hotel payment method settings
export interface HotelPaymentMethodSettingFilterDto extends Filter {
  hotelId?: string;
  paymentMethodIds?: string[];
  status?: PaymentMethodStatusEnum;
}

// Payment provider information
export interface PaymentProviderDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

// Response DTO for hotel payment method settings
export interface HotelPaymentMethodSettingResponseDto {
  globalPaymentMethodId: string;
  propertyPaymentMethodSettingId: string;
  code: string;
  name: string;
  description: string;
  metadata: any;
  paymentProvider?: PaymentProviderDto | null;
}
