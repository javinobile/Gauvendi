import {Pipe, PipeTransform} from '@angular/core';
import {ReservationPricing} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getAmenityRate',
  standalone: true
})
export class GetAmenityRatePipe implements PipeTransform {
  transform(reservationPricing: ReservationPricing, ...args: unknown[]): number {
    if (reservationPricing) {
      return reservationPricing?.amenityPricingList
        ?.filter(x => !x?.isSalesPlanIncluded)
        ?.reduce((a, b) => {
        return a + b?.totalGrossAmount
      }, 0);
    }

    return null;
  }
}
