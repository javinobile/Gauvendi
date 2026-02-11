import {Pipe, PipeTransform} from '@angular/core';
import {ReservationAmenity} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'calculateReservationAmenityCount',
  standalone: true
})
export class CalculateReservationAmenityCountPipe implements PipeTransform {

  transform(value: ReservationAmenity, ...args: unknown[]): number {
    return value?.reservationAmenityDateList?.reduce((acc, cur) => {
      return acc + cur?.count;
    }, 0);
  }

}
