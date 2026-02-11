import {Pipe, PipeTransform} from '@angular/core';
import {HotelAmenity, ReservationAmenityPricing} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'maxServicesDisplay',
  standalone: true
})
export class MaxServicesDisplayPipe implements PipeTransform {

  transform(reservationAmenityPricing: ReservationAmenityPricing[], isIncluded = false): {
    maxDisplay: number;
    filterAmenities: HotelAmenity[]
  } {
    if (reservationAmenityPricing?.length > 0) {
      const hotelAmenities = reservationAmenityPricing
        ?.filter(item => item?.isSalesPlanIncluded === isIncluded)
        ?.reduce((acc, cur) => {
          return acc?.concat(cur?.hotelAmenity);
        }, []);
      const maxWidth = 60;
      let maxValue = 0;
      const result = [];

      hotelAmenities?.forEach((item, index) => {
        result.push(item);
        if (result?.map(x => x?.name)?.join('&nbsp;|&nbsp;')?.length < maxWidth) {
          maxValue += 1;
        }
      });

      return {
        maxDisplay: maxValue,
        filterAmenities: hotelAmenities
      };
    }

    return null;
  }

}
