import {Pipe, PipeTransform} from '@angular/core';
import {EPriceView, ICombinationOptionItem} from '@app/models/option-item.model';
import {differenceInDays} from "date-fns";
import {BookingTransactionService} from "@app/services/booking-transaction.service";
import {ActivatedRoute} from "@angular/router";

@Pipe({
  name: 'calUnitCombinationOptionPrice',
  standalone: true
})
export class CalUnitCombinationOptionPricePipe implements PipeTransform {
  constructor(
    private bookingTransactionService: BookingTransactionService,
    private route: ActivatedRoute
  ) {
  }

  transform(item: ICombinationOptionItem, activeIdx: number, priceView: EPriceView, isIncludedTax = false, isFromMatchingRfc = false): number {
    if (isFromMatchingRfc) {
      if (priceView === EPriceView.PerStay) {
        return isIncludedTax ? item?.items?.[activeIdx]?.rfcRatePlanList?.[0]?.totalGrossAmount : item?.items?.[activeIdx]?.rfcRatePlanList?.[0]?.totalBaseAmount;
      } else {
        const numberOfNights = Math.abs(
          differenceInDays(
            new Date(this.bookingTransactionService.getArrival(this.route.snapshot.queryParams)),
            new Date(this.bookingTransactionService.getDeparture(this.route.snapshot.queryParams))
          )
        );
        const amount = isIncludedTax ? item?.items?.[activeIdx]?.rfcRatePlanList?.[0]?.totalGrossAmount : item?.items?.[activeIdx]?.rfcRatePlanList?.[0]?.totalBaseAmount;
        return numberOfNights > 0 ? amount / numberOfNights : amount;
      }
    } else {
      const masterCode = item?.metadata?.availableRfcRatePlanList?.[0]?.ratePlan?.code;
      const itemFound = item?.metadata?.availableRfcList?.[activeIdx]?.rfcRatePlanList?.find(i => i?.ratePlan?.code === masterCode);
      return priceView === EPriceView.PerStay ? itemFound?.totalSellingRate : itemFound?.averageDailyRate;
    }
  }

}
