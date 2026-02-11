import { Pipe, PipeTransform } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { addDays, parse } from 'date-fns';
import * as moment from 'moment';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { PricingUnitEnum } from '@app/core/graphql/generated/graphql';
import { SectionCodeEnum } from '@app/store/multi-lang/multi-lang.state';

@Pipe({
  name: 'displayIncludedServiceDesc',
  standalone: true
})
export class DisplayIncludedServiceDescPipe implements PipeTransform {
  constructor(private translatePipe: TranslatePipe) {}

  transform(
    adultCount: number,
    childCount: number,
    numberOfRooms: number,
    includedDates: string[],
    bookingDuration: number,
    pricingUnit: PricingUnitEnum,
    amenityName: string,
    checkInDate: string,
    isPets = false
  ): Observable<string> {
    return combineLatest([
      this.translatePipe.transform('DURING_STAY'), // 0
      this.translatePipe.transform('PER_STAY'), // 1
      this.translatePipe.transform('ADULTS'), // 2
      this.translatePipe.transform('ADULT'), // 3
      this.translatePipe.transform('KIDS'), // 4
      this.translatePipe.transform('KID'), // 5
      this.translatePipe.transform('FOR'), // 6
      this.translatePipe.transform('EVERYDAY'), // 7
      this.translatePipe.transform('EXCEPT'), // 8
      this.translatePipe.transform('DAYS'), // 9
      this.translatePipe.transform('DAY'), // 10
      this.translatePipe.transform('BEDROOMS'), // 11
      this.translatePipe.transform('BEDROOM'), // 12
      this.translatePipe.transform('ONLY'), // 13
      this.translatePipe.transform('DAILY'), // 14
      this.translatePipe.transform('PET'), // 15
      this.translatePipe.transform('PETS') // 16
    ]).pipe(
      map((res) => {
        switch (pricingUnit) {
          case PricingUnitEnum.Item:
            return `${amenityName} ${res[1]}`;
          case PricingUnitEnum.Night:
            if (bookingDuration === includedDates?.length) {
              return `${amenityName} ${res[7]}.`;
            } else if (bookingDuration - includedDates?.length === 1) {
              return `${amenityName} ${res[14]} ${res[8]}  ${this.getExceptDate(includedDates, checkInDate, bookingDuration)}.`;
            } else {
              return `${amenityName} ${res[13]} ${res[6]} ${includedDates?.length} ${includedDates?.length > 1 ? res[9] : res[10]} ${
                res[0]
              }.`;
            }
          case PricingUnitEnum.Room:
            return `${amenityName} ${res[6]} ${numberOfRooms} ${numberOfRooms > 1 ? res[11] : res[12]} ${res[1]}.`;
          case PricingUnitEnum.Person:
            if (bookingDuration === includedDates?.length) {
              return `${amenityName} ${res[14]} ${adultCount} ${adultCount > 1 ? (isPets ? res[16] : res[2]) : isPets ? res[15] : res[3]}${
                childCount > 0
                  ? ', ' + childCount + ' ' + (childCount > 1 ? res[4] : res[5])
                  : ''
              }.`;
            } else if (bookingDuration - includedDates?.length === 1) {
              return `${amenityName} ${res[14]} ${adultCount} ${adultCount > 1 ? (isPets ? res[16] : res[2]) : isPets ? res[15] : res[3]}${
                childCount > 0
                  ? ', ' + childCount + ' ' + (childCount > 1 ? res[4] : res[5])
                  : ''
              } ${res[8]} ${this.getExceptDate(includedDates, checkInDate, bookingDuration)}.`;
            } else {
              return `${amenityName} ${res[6]} ${adultCount} ${adultCount > 1 ? (isPets ? res[16] : res[2]) : isPets ? res[15] : res[3]}${
                childCount > 0
                  ? ', ' + childCount + ' ' + (childCount > 1 ? res[4] : res[5])
                  : ''
              } ${res[13]} ${res[6]} ${includedDates?.length} ${includedDates?.length > 1 ? res[9] : res[10]}.`;
            }
          case PricingUnitEnum.PerPersonPerRoom:
            return `${amenityName} ${res[6]} ${adultCount} ${adultCount > 1 ? (isPets ? res[16] : res[2]) : isPets ? res[15] : res[3]}${
              childCount > 0
                ? ', ' + childCount + ' ' + (childCount > 1 ? res[4] : res[5])
                : ''
            } ${res[1]}.`;
        }
      })
    );
  }

  getExceptDate(
    includeDate: string[],
    checkInDate: string,
    bookingDuration: number
  ): string {
    const checkInParse = parse(checkInDate, 'dd-MM-yyyy', new Date());
    let result = null;
    for (let i = 0; i < bookingDuration; i++) {
      const temp = moment(addDays(checkInParse, i)).format('yyyy-MM-DD');
      if (!includeDate?.includes(temp)) {
        result = moment(addDays(checkInParse, i)).format('DD MMMM, yyyy');
        break;
      }
    }
    return result;
  }
}
