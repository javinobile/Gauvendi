import { Translation } from 'src/core/database/entities/base.entity';

export class HotelPaymentTermDto {
  id?: string;
  hotelId?: string;
  name?: string;
  code?: string;
  description?: string;
  payAtHotel?: number;
  payOnConfirmation?: number;
  payAtHotelDescription?: string;
  payOnConfirmationDescription?: string;
  translationList?: Translation[];
}

export class RatePlanPaymentTermSettingDto {
  id?: string;
  hotelId?: string;
  ratePlanId?: string;
  hotelPaymentTermId?: string;
  hotelPaymentTerm?: HotelPaymentTermDto;
  supportedPaymentMethodCodeList?: string[];
  isDefault?: boolean;
}
