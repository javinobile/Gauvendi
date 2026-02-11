import * as moment from 'moment-timezone';
import {Pipe, PipeTransform} from '@angular/core';
import {MultiLangEnum} from "@store/multi-lang/multi-lang.state";
import {HotelConfigService} from "@app/services/hotel-config.service";

@Pipe({
  name: 'dateWithLocale',
  standalone: true
})
export class DateWithLocalePipe implements PipeTransform
{
  constructor(
    private hotelConfigService: HotelConfigService
  ) {
  }
  transform(date: string | Date, locale: string, format: string, useOffsetTz = false, hasDot = false): string {
    if (date)
    {
      const offset = new Date().getTimezoneOffset();
      const timezone = this.hotelConfigService.hotelTimezone.getValue();
      let result = date
        ? (useOffsetTz
            ? offset > 0 ?  moment(date).tz(timezone).add(offset, 'minutes') :  moment(date).tz(timezone)
            : moment(date)
        )?.locale(locale || MultiLangEnum.EN)?.format(format)
        : null;

      if (!hasDot)
      {
        result = result?.replace(/[.]+/gi, '');
      }
      return result;
    }

    return null;
  }
}
