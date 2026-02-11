import {Pipe, PipeTransform} from '@angular/core';
import {ReservationAmenityDate} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getAmenityTotalPrice',
  standalone: true
})
export class GetAmenityTotalPricePipe implements PipeTransform {

  transform(value: ReservationAmenityDate[], totalGrossAmount: number): number {
    if (value) {
      if (!totalGrossAmount) {
        return 0;
      }
      return value.reduce((acc, cur) => acc + +cur?.totalSellingRate, 0);
    }
    return null;
  }

}
