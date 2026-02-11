import { Pipe, PipeTransform } from '@angular/core';
import { BookingInformation } from '@core/graphql/generated/graphql';
import * as moment from "moment/moment";

@Pipe({
  name: 'getDeparture',
  standalone: true
})
export class GetDeparturePipe implements PipeTransform {

  transform(bookingInfo: BookingInformation): any {
    return bookingInfo?.reservationList?.length > 0
      ? [...bookingInfo?.reservationList]
        ?.map(x => x?.departure)
        ?.sort((a, b) => moment(new Date(a)).isBefore(moment(new Date(b))) ? 1 : -1)
        ?.[0]
      : bookingInfo?.departure;
  }

}
