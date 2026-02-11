import {Pipe, PipeTransform} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BookingTransactionService} from '@app/services/booking-transaction.service';
import {differenceInDays} from 'date-fns';

@Pipe({
  name: 'calculatePriceWithTax',
  standalone: true,
})
export class CalculatePriceWithTaxPipe implements PipeTransform {
  constructor(private bookingTransactionService: BookingTransactionService, private route: ActivatedRoute) {
  }

  transform(totalGrossAmount: number, totalBaseAmount: number, priceState: string, includedTax: boolean = null): number {
    if (priceState === 'totalSellingRate') {
      return includedTax ? totalGrossAmount : totalBaseAmount;
    }
    const numberOfNights = Math.abs(
      differenceInDays(
        new Date(this.bookingTransactionService.getArrival(this.route.snapshot.queryParams)),
        new Date(this.bookingTransactionService.getDeparture(this.route.snapshot.queryParams))
      )
    );
    const amount = includedTax ? totalGrossAmount : totalBaseAmount;
    return numberOfNights > 0 ? amount / numberOfNights : amount;
  }
}
