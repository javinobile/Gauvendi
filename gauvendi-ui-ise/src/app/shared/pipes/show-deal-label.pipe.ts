import {Pipe, PipeTransform} from '@angular/core';
import {BookingTransactionService} from "@app/services/booking-transaction.service";

@Pipe({
  name: 'showDealLabel',
  standalone: true
})
export class ShowDealLabelPipe implements PipeTransform {

  constructor(
    private bookingTransactionService: BookingTransactionService
  ) {
  }

  transform(price: number): boolean {
    if (price) {
      return price < this.bookingTransactionService.dealAvgLowestPrice$?.getValue();
    }
    return false;
  }

}
