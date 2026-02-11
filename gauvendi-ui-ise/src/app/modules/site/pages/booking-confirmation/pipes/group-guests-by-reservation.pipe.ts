import { Pipe, PipeTransform } from '@angular/core';
import { Reservation } from '@app/core/graphql/generated/graphql';

import { ReservationGuests } from '../model/guest.model';

@Pipe({
  name: 'groupGuestsByReservation',
  standalone: true
})
export class GroupGuestsByReservationPipe implements PipeTransform {
  transform(reservationList: Reservation[]): ReservationGuests[] {
    return reservationList?.map((res, index) => {
      return {
        index,
        guestList: [
          res?.primaryGuest || null,
          ...(res?.additionalGuest || [])
        ]?.filter((guest) => !!guest),
        productInfo: {
          name: res?.rfc?.name
        }
      } as ReservationGuests;
    });
  }
}
