import {Pipe, PipeTransform} from '@angular/core';
import {HotelPaymentModeCodeEnum} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'parsePaymentMethodName',
  standalone: true
})
export class ParsePaymentMethodNamePipe implements PipeTransform {

  transform(value: HotelPaymentModeCodeEnum, payOnConfirmation: number = null): string {
    switch (value) {
      case HotelPaymentModeCodeEnum.Noguar:
        return 'RESERVE_WITHOUT_CREDIT_CARD';
      case HotelPaymentModeCodeEnum.Guawcc:
        if (+payOnConfirmation > 0) {
          return 'PAY_WITH_CREDIT_CARD';
        }
        return 'GUARANTEE_WITH_CREDIT_CARD';
      case HotelPaymentModeCodeEnum.Guawde:
        return 'GUARANTEE_WITH_DEPOSIT';
      case HotelPaymentModeCodeEnum.Guainv:
        return 'GUARANTEE_WITH_INVOICE';
      case HotelPaymentModeCodeEnum.Paypal:
        return 'GUARANTEE_WITH_PAYPAL';
      default:
        return null;
    }
  }

}
