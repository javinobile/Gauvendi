import { Pipe, PipeTransform } from '@angular/core';
import { Booking } from '@core/graphql/generated/graphql';

@Pipe({
  name: 'checkInfoCompany',
  standalone: true
})
export class CheckInfoCompanyPipe implements PipeTransform {
  transform(booking: Booking): boolean {
    let isValid = false;
    if (!booking) return isValid;

    if (booking.reservationList?.[0]?.company) {
      isValid = true;
    }
    return isValid;
  }
}
