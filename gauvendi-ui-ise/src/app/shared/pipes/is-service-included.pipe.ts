import {Pipe, PipeTransform} from '@angular/core';
import {ReservationAmenity} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'isServiceIncluded',
  standalone: true
})
export class IsServiceIncludedPipe implements PipeTransform {
  transform(value: ReservationAmenity): boolean {
    if (value === null) {
      return false;
    }
    let total: number;
    if (value?.totalGrossAmount) {
      total = value?.reservationAmenityDateList
        ?.filter(item => item?.totalGrossAmount)
        ?.map(item => item?.totalGrossAmount)
        ?.reduce((acc, val) => acc + val, 0);
    } else {
      total = 0;
    }
    return total === 0;
  }
}
