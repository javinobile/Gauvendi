import {Pipe, PipeTransform} from '@angular/core';
import {Reservation} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getOrdinaryGuest',
  standalone: true
})
export class GetOrdinaryGuestPipe implements PipeTransform {

  transform(reservationList: Reservation[], reservationIndex: number, guestList: any, guestIndex: number): {
    key: string;
    ordinary: number;
  } {
    let currentAdultCount = 0;
    let currentChildrenCount = 0;
    reservationList?.forEach((rs, idx) => {
      if (idx < reservationIndex) {
        currentAdultCount += rs?.adult;
        currentChildrenCount += rs?.childrenAgeList?.length;
      }
    });

    guestList?.forEach((g, idx) => {
      if (idx < guestIndex) {
        if (g?.isAdult) {
          currentAdultCount += 1;
        }

        if (!g?.isAdult) {
          currentChildrenCount += 1;
        }
      }
    });

    return guestList?.[guestIndex]?.isAdult ? {
      key: 'ADULT',
      ordinary: currentAdultCount
    } : {
      key: 'CHILD',
      ordinary: currentChildrenCount
    }
  }

}
