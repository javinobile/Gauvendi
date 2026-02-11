import {Pipe, PipeTransform} from '@angular/core';
import {ReservationPricing} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getReservationPricingByIndex',
  standalone: true
})
export class GetReservationPricingByIndexPipe implements PipeTransform {

  transform(reservationPricing: ReservationPricing[], index: string): ReservationPricing {
    return reservationPricing?.find(x => x?.index === index);
  }

}
