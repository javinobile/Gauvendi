import {Pipe, PipeTransform} from '@angular/core';
import {HotelAmenity, ReservationAmenityPricing} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'sortExtraServices',
  standalone: true
})
export class SortExtraServicesPipe implements PipeTransform {

  transform(reservationAmenities: ReservationAmenityPricing[]): HotelAmenity[] {
    if (reservationAmenities?.length > 0) {
      return [
        ...reservationAmenities?.filter(x => x?.isSalesPlanIncluded),
        ...reservationAmenities?.filter(x => !x?.isSalesPlanIncluded),
      ]?.reduce((acc, cur) => {
        return acc?.concat(cur?.hotelAmenity);
      }, [])
    }

    return null;
  }

}
