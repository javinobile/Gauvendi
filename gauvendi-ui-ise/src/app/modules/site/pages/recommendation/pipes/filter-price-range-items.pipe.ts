import { inject, Pipe, PipeTransform } from '@angular/core';
import { EPriceView, ICombinationOptionItem } from '@models/option-item.model';
import { BookingTransactionService } from '@app/services/booking-transaction.service';

@Pipe({
  name: 'filterPriceRangeItems',
  standalone: true
})
export class FilterPriceRangeItemsPipe implements PipeTransform {
  private bookingTransactionService = inject(BookingTransactionService);

  transform(
    value: ICombinationOptionItem[],
    priceRange: { max: number; min: number },
    priceState: EPriceView,
    currencyRate: number
  ): ICombinationOptionItem[] {
    if (!priceRange) return value;

    if (value?.length > 0) {
      return value?.filter((stay) => {
        const currentPrices = [
          ...(stay?.metadata.availableRfcRatePlanList || []),
          ...(stay?.metadata.unavailableRfcRatePlanList || [])
        ]?.map((plan) =>
          this.bookingTransactionService.parseValue(
            plan[
              priceState === EPriceView.PerStay
                ? 'totalSellingRate'
                : 'averageDailyRate'
            ],
            currencyRate
          )
        );
        return (
          currentPrices?.filter(
            (price) => price >= priceRange?.min && price <= priceRange?.max
          )?.length > 0
        );
      });
    }
    return value;
  }
}
