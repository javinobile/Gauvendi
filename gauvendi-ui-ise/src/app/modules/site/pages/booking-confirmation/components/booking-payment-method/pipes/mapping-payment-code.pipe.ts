import { Pipe, PipeTransform } from '@angular/core';
import { HotelPaymentModeCodeEnum } from '@app/core/graphql/generated/graphql';
@Pipe({
  name: 'mappingPaymentCode',
  standalone: true
})
export class MappingPaymentCodePipe implements PipeTransform {
  transform(value: string) {
    if (!value) return '';
    const mappingCodes = {
      [HotelPaymentModeCodeEnum.Guawcc]: 'CREDIT_CARD',
      [HotelPaymentModeCodeEnum.Guawde]: 'BANK_TRANSFER',
      [HotelPaymentModeCodeEnum.Guainv]: 'PAY_ON_ARRIVAL',
      [HotelPaymentModeCodeEnum.Noguar]: 'NO_GUARANTEE',
      [HotelPaymentModeCodeEnum.Paypal]: 'PAYPAL',
      [HotelPaymentModeCodeEnum.Pmdoth]: 'OTHER_PAYMENT_METHOD'
    };

    return mappingCodes[value] || 'CREDIT_CARD';
  }
}
