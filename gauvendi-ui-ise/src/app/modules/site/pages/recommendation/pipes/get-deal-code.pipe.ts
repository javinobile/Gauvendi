import {Pipe, PipeTransform} from '@angular/core';
import {RfcRatePlan} from '@app/core/graphql/generated/graphql';
import {BookingTransactionService} from "@app/services/booking-transaction.service";

@Pipe({
  name: 'getDealCode',
  standalone: true
})
export class GetDealCodePipe implements PipeTransform {

  constructor(
    private bookingTransactionService: BookingTransactionService
  ) {
  }
  transform(value: RfcRatePlan[]): string {
    const avgPrice = this.bookingTransactionService.dealAvgLowestPrice$?.value;
    return value.find(x => +x.averageDailyRate < avgPrice)?.ratePlan?.code;
  }

}
