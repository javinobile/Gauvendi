import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';

@Pipe({
  name: 'dateWithLocaleAndTimezone',
  standalone: true,
})
export class DateWithLocaleAndTimezonePipe implements PipeTransform {
  transform(date: string | Date, locale: string, timezone: string, format: string, useOffsetTz = false, hasDot = false): string {
    if (date && timezone) {
      let result = date
        ? (useOffsetTz
            ? moment(date).tz(timezone)
            : moment(date)
        )?.locale(locale || MultiLangEnum.EN)?.format(format)
        : null;

      if (!hasDot) {
        result = result?.replace(/[.]+/gi, '');
      }
      return result;
    }

    return null;
  }
}
