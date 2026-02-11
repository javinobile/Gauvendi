import {Pipe, PipeTransform} from '@angular/core';
import {ReservationAmenity} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'totalAmenityList',
  standalone: true
})
export class TotalAmenityListPipe implements PipeTransform {

  transform(value: ReservationAmenity[], ...args: unknown[]): unknown {
    return value?.reduce((acc, curr) => {
      return acc + curr?.reservationAmenityDateList?.reduce((a, b) => {
        return a + b?.totalSellingRate;
      }, 0);
    }, 0);
  }

}
