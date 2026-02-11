import * as moment from 'moment';
import {isAfter, isBefore, isSameDay, isSameMonth} from 'date-fns';
import {formatDate} from '@angular/common';

export class DateUtils {
  public static safeDate(date: string | Date): Date {
    const offsetTimezone = new Date().getTimezoneOffset();
    if (offsetTimezone > 0) {
      return moment(new Date(date)).add(offsetTimezone, 'minutes').toDate();
    }
    return moment(new Date(date)).toDate();
  }

  // date-fns
  public static isSameDay(date: string | Date, dateCompare: string | Date): boolean {
    return date && dateCompare
      ? isSameDay(this.safeDate(date), this.safeDate(dateCompare))
      : false;
  }

  public static isSameMonth(date: string | Date, dateCompare: string | Date): boolean {
    return date && dateCompare
      ? isSameMonth(this.safeDate(date), this.safeDate(dateCompare))
      : false;
  }

  public static isAfter(date: string | Date, dateCompare: string | Date): boolean {
    return date && dateCompare
      ? isAfter(this.safeDate(date), this.safeDate(dateCompare))
      : false;
  }

  public static isBefore(date: string | Date, dateCompare: string | Date): boolean {
    return date && dateCompare
      ? isBefore(this.safeDate(date), this.safeDate(dateCompare))
      : false;
  }

  // moment
  public static isSameOrAfter(date: string | Date, dateCompare: string | Date): boolean {
    return date && dateCompare
      ? moment(this.safeDate(date)).isSameOrAfter(moment(this.safeDate(dateCompare)))
      : false;
  }

  public static isSameOrBefore(date: string | Date, dateCompare: string | Date): boolean {
    return date && dateCompare
      ? moment(this.safeDate(date)).isSameOrBefore(moment(this.safeDate(dateCompare)))
      : false;
  }

  /**
   * Compare 2 days with moment
   * @param date: date
   * @param dateCompare: date compare
   */
  public static isSame(date: string | Date, dateCompare: string | Date): boolean {
    return date && dateCompare
      ? moment(this.safeDate(date))?.startOf('dates')
        .isSame(moment(this.safeDate(dateCompare))?.startOf('dates'))
      : false;
  }

  public static isSameDateOnCalendar(checkDate: Date, targetDate: Date): boolean {
    const checkDateStr = formatDate(checkDate, 'yyyy-MM-dd', 'en-US');
    const targetDateStr = formatDate(targetDate, 'yyyy-MM-dd', 'en-US');
    return checkDateStr === targetDateStr;
  }

  public static convertDateTime(dateTime: number, format: string = 'yyyy-MM-DD'): string {
    const offset = new Date(dateTime).getTimezoneOffset();
    return moment(dateTime).utc().add(offset, 'minutes').format(format);
  }
}
