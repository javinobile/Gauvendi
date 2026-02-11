import {Pipe, PipeTransform} from '@angular/core';
import {ReservationPricing} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'totalBedrooms',
  standalone: true
})
export class TotalBedroomsPipe implements PipeTransform {

  transform(value: ReservationPricing[], ...args: unknown[]): number {
    return value?.reduce((acc, cur) => {
      return acc + cur?.roomProduct?.numberOfBedrooms
    }, 0);
  }

}
