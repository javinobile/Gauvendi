import { HotelPaymentTermDto } from "@src/modules/booking/dtos/booking.dto";

export class RatePlanPaymentTermSettingDto {
  id: string;
  hotelId: string;
  ratePlanId: string;
  hotelPaymentTermId: string;
  supportedPaymentMethodCodes: string[];
  hotelPaymentTerm?: HotelPaymentTermDto;
  supportedPaymentMethodCodeList?: string[];
  isDefault?: boolean;
}

export class PropertyPaymentTermDto {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  payAtHotel?: number;
  payAtHotelDescription?: string;
  payOnConfirmation?: number;
  payOnConfirmationDescription?: string;
}

export class PaymentMethodDto {
  id: string;
  code: string;
  name: string;
  description: string;
}

export class RatePlanPaymentTermSettingResponseDto {
  id?: string;
  propertyId?: string;
  salesPlanId?: string;
  propertyPaymentTermId?: string;
  propertyPaymentTerm?: PropertyPaymentTermDto;
  supportedPaymentMethodCodeList?: string[];
  paymentMethodList?: PaymentMethodDto[];
  isDefault?: boolean;
}
