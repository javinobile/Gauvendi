import {Pipe, PipeTransform} from '@angular/core';
import * as moment from 'moment-timezone';
import 'moment-timezone/builds/moment-timezone-with-data-10-year-range';
import {MultiLangEnum} from "@store/multi-lang/multi-lang.state";

@Pipe({
  name: 'dateTimezoneWithLocale',
  standalone: true
})
export class DateTimezoneWithLocalePipe implements PipeTransform
{

  transform(date: string | Date, timezone: string, locale: string, format: string, hasDot = false): string {
    let result = date
      ? moment(new Date(date))?.tz(timezone)
        ?.locale(locale || MultiLangEnum.EN)
        ?.format(format)
      : null;

    if (!hasDot)
    {
      result = result?.replace(/[.]+/gi, '');
    }
    return result;
  }

}
