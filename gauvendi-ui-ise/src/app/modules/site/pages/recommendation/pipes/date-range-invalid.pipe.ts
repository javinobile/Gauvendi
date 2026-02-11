import {Pipe, PipeTransform} from '@angular/core';
import {
  CalendarDailyRate,
  CalendarDailyRestriction,
  CalendarPriceOptionStatus,
  RestrictionCodeEnum
} from "@core/graphql/generated/graphql";
import * as moment from "moment";
import {DateUtils} from "@utils/DateUtils";
import {differenceInCalendarDays} from "date-fns";

@Pipe({
  name: 'dateRangeInvalid',
  standalone: true
})
export class DateRangeInvalidPipe implements PipeTransform {

  transform(checkIn: Date, checkOut: Date, calendarDailyRates: CalendarDailyRate[]): boolean {
    if (!checkIn || !checkOut || !calendarDailyRates) {
      return false;
    }

    const rangeChecking = calendarDailyRates?.filter(x => {
      return moment(x?.date).isSameOrAfter(moment(DateUtils.safeDate(checkIn)).startOf('dates'))
        && moment(x?.date).isBefore(moment(DateUtils.safeDate(checkOut)).startOf('dates'));
    });

    // check soldout
    if (rangeChecking?.some(x => x?.priceOptionList?.length === 0)) {
      return true;
    }

    if (rangeChecking?.length > 0) {
      // check CTA, CTD
      const checkInInfo = rangeChecking
        ?.find(x => moment(DateUtils.safeDate(checkIn)).startOf('dates').isSame(moment(x?.date)));

      const checkOutInfo = calendarDailyRates
        ?.find(x => moment(DateUtils.safeDate(checkOut)).startOf('dates').isSame(moment(x?.date)) && x?.priceOptionList?.[0]?.restrictionList
          ?.find(i => i?.restrictionCode === RestrictionCodeEnum.RstrCloseToDeparture));
      if (checkInInfo?.priceOptionList?.[0]?.status !== CalendarPriceOptionStatus.Default
        || checkOutInfo?.priceOptionList?.[0]?.restrictionList?.find(x => x?.restrictionCode === RestrictionCodeEnum.RstrCloseToArrival)
        || checkOutInfo
      ) {
        return true;
      }

      // minLOS
      const numberOfNight = Math.abs(differenceInCalendarDays(checkOut, checkIn));
      const foundMinLos = rangeChecking
        ?.find(x => moment(DateUtils.safeDate(checkIn)).startOf('dates').isSame(moment(x?.date)) && x?.priceOptionList?.[0]?.restrictionList)
        ?.priceOptionList?.[0]?.restrictionList?.filter(x => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin);

      if (Math.max(...foundMinLos?.map(x => +x?.restrictionValue)) > numberOfNight) {
        return true;
      }

      // maxLOS
      const foundMaxLos = rangeChecking
        ?.find(x => moment(DateUtils.safeDate(checkIn)).startOf('dates').isSame(moment(x?.date)) && x?.priceOptionList?.[0]?.restrictionList)
        ?.priceOptionList?.[0]?.restrictionList?.filter(x => x?.restrictionCode === RestrictionCodeEnum.RstrLosMax);
      if (numberOfNight > Math.min(...foundMaxLos?.map(x => +x?.restrictionValue))) {
        return true;
      }

      // LST
      const foundLst: CalendarDailyRestriction[] = rangeChecking?.reduce((a, b) => {
        return a?.concat(b?.priceOptionList?.[0]?.restrictionList?.filter(x => x?.restrictionCode === RestrictionCodeEnum.RstrMinLosThrough))
      }, []);

      if (Math.max(...foundLst?.map(x => +x?.restrictionValue)) > numberOfNight) {
        return true;
      }
    }

    return false;
  }

}
