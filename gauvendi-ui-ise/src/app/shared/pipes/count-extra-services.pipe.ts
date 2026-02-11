import {Pipe, PipeTransform} from '@angular/core';
import {ReservationAmenity} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'countExtraServices',
  standalone: true
})
export class CountExtraServicesPipe implements PipeTransform {
  transform(value: ReservationAmenity[], isIncluded: boolean = null): number {
    if (!(value?.length > 0)) {
      return 0;
    }
    if (isIncluded === null) {
      return value?.length;
    }
    return value
      ?.filter(item => {
        let totalPrice: number;
        if (item.totalGrossAmount === null || item.totalGrossAmount === 0) {
          totalPrice = 0;
        } else {
          totalPrice = item?.reservationAmenityDateList
            ?.map(item => item?.totalGrossAmount)
            ?.reduce((acc, val) => acc + val, 0);
        }
        return isIncluded ? totalPrice === 0 : totalPrice > 0;
      })
      ?.length;
  }
}
