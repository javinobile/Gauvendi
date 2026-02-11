import {Pipe, PipeTransform} from "@angular/core";
import {HotelAmenity, ReservationAmenity} from "@core/graphql/generated/graphql";

@Pipe({
  name: "getAmenitiesIncludedCpp",
  standalone: true,
})
export class GetAmenitiesIncludedCppPipe implements PipeTransform {
  transform(reservationAmenity: ReservationAmenity[], isIncluded = false): {
    maxDisplay: number;
    filterAmenities: HotelAmenity[]
  } {
    if (reservationAmenity?.length > 0) {
      const hotelAmenities = reservationAmenity
        ?.filter(item => {
          let total;
          if (item?.totalGrossAmount) {
            total = item?.reservationAmenityDateList
              ?.filter(item => item?.totalGrossAmount)
              ?.map(item => item?.totalGrossAmount)
              ?.reduce((acc, val) => acc + val, 0)
          } else {
            total = 0
          }

          return (total === 0) === isIncluded;
        })
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
