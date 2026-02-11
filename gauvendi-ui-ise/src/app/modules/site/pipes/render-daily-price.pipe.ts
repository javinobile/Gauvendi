import {Pipe, PipeTransform} from '@angular/core';
import {StayOptionSuggestion} from "@core/graphql/generated/graphql";
import {DateCell} from "@models/calendar.model";
import * as moment from "moment";
import {differenceInDays, isSameDay} from "date-fns";

@Pipe({
  name: 'renderDailyPrice',
  standalone: true
})
export class RenderDailyPricePipe implements PipeTransform {

  transform(cell: DateCell, lowestPriceStayOption: StayOptionSuggestion, isInclusive: boolean, checkInDate: Date, checkOutDate: Date): number {
    if (checkInDate && checkOutDate && lowestPriceStayOption) {
      if (moment(cell?.value).isBetween(moment(checkInDate), moment(checkOutDate)) || isSameDay(cell?.value, checkInDate)) {
        const numberOfNights = Math.abs(
          differenceInDays(
            checkInDate,
            checkOutDate
          )
        );
        let amount = isInclusive ? lowestPriceStayOption?.availableRfcRatePlanList?.[0]?.totalGrossAmount : lowestPriceStayOption?.availableRfcRatePlanList?.[0]?.totalBaseAmount;

        if (lowestPriceStayOption?.unavailableRfcRatePlanList?.length > 0) {
          amount = isInclusive ? lowestPriceStayOption?.unavailableRfcRatePlanList?.[0]?.totalGrossAmount : lowestPriceStayOption?.unavailableRfcRatePlanList?.[0]?.totalBaseAmount;
        }

        return numberOfNights > 0 ? amount / numberOfNights : amount;
      } else {
        return isInclusive ? cell?.grossPrice : cell?.netPrice
      }
    } else {
      return isInclusive ? cell?.grossPrice : cell?.netPrice;
    }
  }

}
