import {Pipe, PipeTransform} from '@angular/core';
import {
  AmenityReservation,
  ReservationAmenityAgeCategoryPricing,
  ReservationAmenityPricing
} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getAmenityCountByAge',
  standalone: true
})
export class GetAmenityCountByAgePipe implements PipeTransform {

  transform(amenityReservation: ReservationAmenityAgeCategoryPricing[], isAdult = true): number {
    if (isAdult) {
      return amenityReservation?.find(x => x?.ageCategoryCode === 'DEFAULT')?.count;
    } else {
      return amenityReservation?.filter(x => x?.ageCategoryCode !== 'DEFAULT')?.reduce((prev, cur) => prev + cur?.count, 0);
    }

  }

}
