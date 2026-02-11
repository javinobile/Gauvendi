import { Filter } from '@src/core/dtos/common.dto';
import { IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';

export class HotelPaymentTermFilterDto extends Filter {
  @IsUUID('4')
  hotelId?: string;

  @IsUUID('4')
  @OptionalArrayProperty()
  ids?: string[];
}

export class HotelPaymentTermsFilterDto extends Filter {
  hotelId: string;
  codes: string[];
}

export class HotelPaymentTermTranslationDto {
  id: string;
  hotelId?: string;
  hotelPaymentTermId?: string;
  languageCode: string;
  name?: string;
  description?: string;
  payAtHotelDescription?: string;
  payOnConfirmationDescription?: string;
}

export class PaymentMethodDto {
  id: string;
  code: string;
  name: string;
  description: string;
  supportedPaymentProviderCodeList?: string[];
}

export class HotelPaymentTermResponseDto {
  id: string;
  name: string;
  code: string;
  payOnConfirmation: number;
  payAtHotel: number;
  description: string;
  payAtHotelDescription: string;
  payOnConfirmationDescription: string;
  translationList: HotelPaymentTermTranslationDto[];
  paymentMethodList: PaymentMethodDto[];
  supportedPaymentMethodCodeList: string[];
}
