import {Pipe, PipeTransform} from '@angular/core';
import {HotelPaymentModeCodeEnum} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getPaymentModeStatus',
  standalone: true
})
export class GetPaymentModeStatusPipe implements PipeTransform {

  transform(code: HotelPaymentModeCodeEnum, payNow: number): boolean {
    // Not display until payNow is a valid number
    if (payNow === undefined || payNow === null) {
      return true;
    }

    // true: disabled
    // false: enabled
    if (payNow && payNow > 0) {
      switch (code) {
        case HotelPaymentModeCodeEnum.Noguar:
          return true;
        default:
          return false;
      }
    }

    // disabled paypal if payNow = 0
    return code === HotelPaymentModeCodeEnum.Paypal;
  }

}
