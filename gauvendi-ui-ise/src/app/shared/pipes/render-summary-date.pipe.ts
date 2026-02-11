import { inject, Pipe, PipeTransform } from '@angular/core';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { differenceInDays } from 'date-fns';
import * as moment from 'moment';
import { combineLatest, map, Observable } from 'rxjs';
import { TranslatePipe } from './translate.pipe';

@Pipe({
  name: 'renderSummaryDate',
  standalone: true
})
export class RenderSummaryDatePipe implements PipeTransform {
  private translatePipe = inject(TranslatePipe);

  transform(
    dateSelected: Date[],
    locale: string,
    format: string
  ): Observable<string> {
    if (dateSelected?.length === 0) {
      return null;
    }

    return combineLatest([
      this.translatePipe.transform('ARRIVAL'),
      this.translatePipe.transform('DEPARTURE'),
      this.translatePipe.transform('NIGHT'),
      this.translatePipe.transform('NIGHTS')
    ]).pipe(
      map(([arrivalText, departureText, nightText, nightsText]) => {
        const [from, to] = dateSelected;

        if (!from) {
          return `${arrivalText}: --, ${departureText}: --`;
        }

        let result;
        if (from && !to) {
          result = `${arrivalText}: ${this.getDateWithLocale(from, locale, format)}, ${departureText}: --`;
        } else {
          const count = Math.abs(
            typeof from === 'number'
              ? +to - +from
              : differenceInDays(new Date(from), new Date(to))
          );

          const countText = `(${count} ${count > 1 ? nightsText : nightText})`;

          result = `${arrivalText}: ${this.getDateWithLocale(from, locale, format)}, ${departureText}: ${this.getDateWithLocale(to, locale, format)} ${countText}`;
        }
        // Remove any dots from the result string to ensure clean formatting
        return result?.replace(/[.]+/gi, '');
      })
    );
  }

  getDateWithLocale(date: Date, locale: string, format: string): string {
    return date
      ? moment(new Date(date))
          ?.locale(locale || MultiLangEnum.EN)
          ?.format(format)
      : null;
  }
}
