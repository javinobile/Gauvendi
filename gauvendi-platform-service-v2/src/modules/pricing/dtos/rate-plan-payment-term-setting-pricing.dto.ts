import { IsUUID } from 'class-validator';
import { ArrayProperty } from 'src/core/decorators/array-property.decorator';

export class RatePlanPaymentTermSettingListPricingFilterDto {
  @IsUUID('4')
  hotelId: string;

  @ArrayProperty()
  @IsUUID('4', { each: true })
  ratePlanIdList: string[];
}

export class RatePlanPaymentTermSettingPricingDto {
  id: string;
  hotelId: string;
  ratePlanId: string;
  hotelPaymentTermId: string;
  hotelPaymentTerm: {
    id: string;
    code: string;
    name: string;
    description: string;
    payAtHotel: number;
    payAtHotelDescription: string;
    payOnConfirmation: number;
    payOnConfirmationDescription: string;
  };
  paymentMethods: {
    id: string;
    code: string;
    name: string;
    description: string;
  }[];
  supportedPaymentMethodCodes: string[];
  isDefault: boolean;
}
