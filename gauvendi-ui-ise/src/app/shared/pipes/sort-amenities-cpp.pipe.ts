import {Pipe, PipeTransform} from '@angular/core';
import {HotelAmenity, ReservationAmenity} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'sortAmenitiesCpp',
  standalone: true
})
export class SortAmenitiesCppPipe implements PipeTransform {

  transform(reservationAmenities: ReservationAmenity[]): HotelAmenity[] {
    if (reservationAmenities?.length > 0) {
      return [
        ...reservationAmenities?.filter(item => {
          let total: number;
          if (item?.totalGrossAmount) {
            total = item?.reservationAmenityDateList
              ?.filter(item => item?.totalGrossAmount)
              ?.map(item => item?.totalGrossAmount)
              ?.reduce((acc, val) => acc + val, 0)
          } else {
            total = 0
          }

          return total === 0;
        }),
        ...reservationAmenities?.filter(item => {
          let total: number;
          if (item?.totalGrossAmount) {
            total = item?.reservationAmenityDateList
              ?.filter(item => item?.totalGrossAmount)
              ?.map(item => item?.totalGrossAmount)
              ?.reduce((acc, val) => acc + val, 0)
          } else {
            total = 0
          }

          return total !== 0;
        }),
      ]?.reduce((acc, cur) => {
        return acc?.concat(cur?.hotelAmenity);
      }, [])
    }

    return null;
  }

}
