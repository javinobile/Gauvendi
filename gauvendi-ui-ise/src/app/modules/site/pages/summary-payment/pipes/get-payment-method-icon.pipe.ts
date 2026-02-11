import {Pipe, PipeTransform} from '@angular/core';
import {HotelPaymentModeCodeEnum} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getPaymentMethodIcon',
  standalone: true
})
export class GetPaymentMethodIconPipe implements PipeTransform {

  transform(value: HotelPaymentModeCodeEnum, ...args: unknown[]): unknown {
    switch (value) {
      case HotelPaymentModeCodeEnum.Noguar:
        return 'assets/payment/bank-transfer.svg';
      case HotelPaymentModeCodeEnum.Guawcc:
        return 'assets/payment/credit-card.svg';
      case HotelPaymentModeCodeEnum.Paypal:
        return 'assets/payment/paypal.svg';
      case HotelPaymentModeCodeEnum.Guawde:
      case HotelPaymentModeCodeEnum.Guainv:
        return 'assets/payment/pay-on-arrival.svg';
      default:
        return 'assets/payment/pay-on-arrival.svg';
    }
  }

}
