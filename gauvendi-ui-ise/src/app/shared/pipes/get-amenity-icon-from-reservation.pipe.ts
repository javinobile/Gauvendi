import { Pipe, PipeTransform } from '@angular/core';
import {
  HotelAmenity,
  ReservationAmenity
} from '@core/graphql/generated/graphql';

@Pipe({
  name: 'getAmenityIconFromReservation',
  standalone: true
})
export class GetAmenityIconFromReservationPipe implements PipeTransform {
  transform(
    availableAmenityList: HotelAmenity[],
    amenityList: ReservationAmenity[]
  ): HotelAmenity[] {
    const amenityCode = amenityList?.map((x) => x?.hotelAmenity?.code);
    return availableAmenityList?.filter((x) => amenityCode?.includes(x?.code));
  }
}
