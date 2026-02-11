import { Pipe, PipeTransform } from '@angular/core';
import { differenceInCalendarDays, isAfter, isBefore } from 'date-fns';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  CalendarDailyRate,
  CalendarPriceOptionLabel,
  RestrictionCodeEnum
} from '@core/graphql/generated/graphql';
import { combineLatest, Observable, of } from 'rxjs';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { DateUtils } from '@utils/DateUtils';

@Pipe({
  name: 'renderTooltipMessage',
  standalone: true
})
export class RenderTooltipMessagePipe implements PipeTransform {
  constructor(private translatePipe: TranslatePipe) {}

  transform(
    cell: any,
    rateList: CalendarDailyRate[],
    from: Date | string,
    to: Date | string,
    checkInDateInfo: CalendarDailyRate
  ): Observable<string> {
    if (!rateList) {
      return null;
    }

    if (!from && cell?.isHidden) {
      return this.translatePipe.transform('HOTEL_OPERATION_VIOLATED_MESSAGE');
    }

    if (cell?.isStayIn) {
      return this.translatePipe.transform('STAY_IN_ONLY');
    }

    if (cell?.isCTA) {
      return this.translatePipe.transform('CTA_MESSAGE');
    }

    if (cell?.isCTD) {
      return this.translatePipe.transform('CTD_MESSAGE');
    }

    if (from && to) {
      if (moment(new Date(cell?.value)).isSame(moment(new Date(from)))) {
        return this.translatePipe.transform('CHECK_IN');
      } else {
        if (moment(new Date(cell?.value)).isSame(moment(new Date(to)))) {
          return this.translatePipe.transform('CHECK_OUT');
        } else {
          if (
            moment(new Date(cell?.value)).isBetween(
              moment(new Date(from)),
              moment(new Date(to))
            )
          ) {
            return of(null);
          }
        }
      }
    } else {
      if (from) {
        if (!isAfter(new Date(cell?.value), new Date(from))) {
          return null;
        }

        const losValid = this.checkLOSValid(from, cell?.value, checkInDateInfo);
        const lstValid = this.checkLSTValid(from, cell?.value, rateList);
        const selectedValue = Math.max(+losValid?.value, +lstValid?.value);
        const maximumLos = this.getNumberOfNightMaxLos(from, checkInDateInfo);

        return combineLatest([
          this.translatePipe.transform('NIGHT_MINIMUM'),
          this.translatePipe.transform('NIGHTS_MINIMUM'),
          this.translatePipe.transform('NIGHT_MAXIMUM'),
          this.translatePipe.transform('NIGHTS_MAXIMUM')
        ]).pipe(
          map(([nightMinimum, nightsMinimum, nightMaximum, nightsMaximum]) => {
            if (
              maximumLos > 0 &&
              (!losValid?.valid || !lstValid?.valid) &&
              selectedValue > 1
            ) {
              return `${selectedValue}-${selectedValue > 1 ? nightsMinimum : nightMinimum}/${maximumLos}-${maximumLos > 1 ? nightsMaximum : nightMaximum}`;
            } else if (
              (!losValid?.valid || !lstValid?.valid) &&
              selectedValue > 1
            ) {
              return `${selectedValue}-${selectedValue > 1 ? nightsMinimum : nightMinimum}`;
            } else if (maximumLos > 0) {
              return `${maximumLos}-${maximumLos > 1 ? nightsMaximum : nightMaximum}`;
            }

            return null;
          })
        );
      }
    }
    return null;
  }

  getNumberOfNightMaxLos(from, checkInInfo: CalendarDailyRate): number {
    const maximumLos =
      checkInInfo?.priceOptionList?.[0]?.restrictionList?.filter(
        (y) => y?.restrictionCode === RestrictionCodeEnum.RstrLosMax
      );

    const listLosValue = maximumLos?.map((x) => +x?.restrictionValue) || [];
    return listLosValue?.length > 0 ? Math.min(...listLosValue) : 0;
  }

  checkLSTValid(
    checkIn,
    checkOut,
    rateList: CalendarDailyRate[]
  ): { valid: boolean; date: string; value: string } {
    const lstList = rateList?.filter((x) =>
      x?.priceOptionList[0]?.restrictionList?.find(
        (y) => y?.restrictionCode === RestrictionCodeEnum.RstrMinLosThrough
      )
    );
    let result = { valid: true, date: null, value: null };

    for (const item of lstList) {
      const diffRange = differenceInCalendarDays(
        new Date(checkOut),
        new Date(checkIn)
      );
      const diffLST = differenceInCalendarDays(
        DateUtils.safeDate(item?.date),
        new Date(checkIn)
      );
      const lstValue = item?.priceOptionList[0].restrictionList?.find(
        (x) => x?.restrictionCode === RestrictionCodeEnum.RstrMinLosThrough
      );

      if (
        diffLST >= 0 &&
        isBefore(DateUtils.safeDate(item?.date), new Date(checkOut))
      ) {
        // in case has 2 LST in date range selected
        const restrictionValue = lstValue?.restrictionValue?.includes('-')
          ? +lstValue?.restrictionValue?.split('-')?.shift()
          : +lstValue?.restrictionValue;
        if (diffRange >= restrictionValue) {
          result = {
            valid: true,
            date: null,
            value: null
          };
        } else {
          result = {
            valid: false,
            date: item?.date,
            value: lstValue?.restrictionValue
          };
        }
      }
    }
    return result;
  }

  checkLOSValid(
    from,
    to,
    checkInInfo: CalendarDailyRate
  ): { valid: boolean; value: number } {
    const los = checkInInfo?.priceOptionList?.[0]?.restrictionList?.filter(
      (x) => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin
    );

    if (los?.length > 0) {
      const listLosValue: number[] = los.reduce((p, c) => {
        return p.concat(+c?.restrictionValue);
      }, []);

      if (listLosValue?.length > 0) {
        const maximumLOS = Math.max(...listLosValue);

        const diffRange = differenceInCalendarDays(
          new Date(to),
          new Date(from)
        );

        return {
          valid: diffRange >= maximumLOS,
          value: maximumLOS
        };
      }
    }

    return {
      valid: true,
      value: null
    };
  }
}
