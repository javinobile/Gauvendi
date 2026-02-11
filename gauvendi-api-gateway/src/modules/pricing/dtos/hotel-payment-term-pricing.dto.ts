import { Translation } from "src/core/enums/common.enum";

export class HotelPaymentTermListPricingFilterDto {
  hotelId: string;
}

export class HotelPaymentTermListPricingResponseDto {
  id: string;
  name: string;
  code: string;
  payOnConfirmation: number;
  payAtHotel: number;
  description: string;
  payAtHotelDescription: string;
  payOnConfirmationDescription: string;
  translations: Translation[];
  supportedPaymentMethodCodes: string[];
  paymentMethods: {
    id: string;
    code: string;
    name: string;
    description: string;
    supportedPaymentProviderCodeList: string[];
  }[];
}
