import {Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2} from '@angular/core';
import {CalendarDailyRate, RestrictionCodeEnum} from "@core/graphql/generated/graphql";
import {DateUtils} from "@utils/DateUtils";
import {differenceInCalendarDays, isBefore, isSameDay} from "date-fns";

@Directive({
  selector: '[appMobileDateSelect]',
  standalone: true
})
export class MobileDateSelectDirective {
  @Input() checkInDate: Date;
  @Input() dateHover: Date;
  @Input() calendarDailyRates: CalendarDailyRate[];
  @Output() dateViolated = new EventEmitter();

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
  }

  @HostListener('click') onClick() {
    if (!this.calendarDailyRates) {
      return;
    }
    const calendarCellElement = document.getElementsByClassName('calendarCell');
    this.removeClass('violated', calendarCellElement);
    this.dateViolated.emit(null);
    if (this.checkInDate && !isSameDay(this.checkInDate, this.dateHover) && (!this.checkLOSValid(this.checkInDate, this.dateHover) || !this.checkLSTValid(this.checkInDate, this.dateHover) || this.violateMaxLos(this.checkInDate, this.dateHover))) {
      this.renderer.addClass(this.el.nativeElement, 'violated');
      this.dateViolated.emit(this.dateHover);
    }
  }

  @HostListener('touchstart') onTouch() {
    if (!this.calendarDailyRates) {
      return;
    }
    const calendarCellElement = document.getElementsByClassName('calendarCell');
    this.removeClass('violated', calendarCellElement);
    this.dateViolated.emit(null);
    if (this.checkInDate && (!this.checkLOSValid(this.checkInDate, this.dateHover) || !this.checkLSTValid(this.checkInDate, this.dateHover) || this.violateMaxLos(this.checkInDate, this.dateHover))) {
      this.renderer.addClass(this.el.nativeElement, 'violated');
      this.dateViolated.emit(this.dateHover);
    }
  }

  removeClass(className: string, calendarCellElement: HTMLCollectionOf<Element>): void {
    for (let i = 0; i < calendarCellElement?.length; i++) {
      this.renderer.removeClass(calendarCellElement?.[i], className);
    }
  }

  checkLOSValid(from: Date, to: Date): boolean {
    const los = this.calendarDailyRates?.filter(item => {
      return item?.priceOptionList[0]?.restrictionList?.length > 0
        && item?.priceOptionList[0]?.restrictionList?.find(x => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin)
        && DateUtils.isSameDateOnCalendar(from, item?.date);
    });

    if (los?.length > 0) {
      const listLosValue: number[] = los.reduce((p, c) => {
        return p.concat(c?.priceOptionList[0]?.restrictionList?.filter(x => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin).map(y => y?.restrictionValue));
      }, []).map(x => +x);

      if (listLosValue?.length > 0) {
        const maximumLOS = Math.max(...listLosValue);

        const diffRange = differenceInCalendarDays(new Date(to), new Date(from));

        return diffRange >= maximumLOS;
      }
    }

    return true;
  }

  getLST(): CalendarDailyRate[] {
    return this.calendarDailyRates?.filter(x => x?.priceOptionList[0]?.restrictionList?.find(y => y?.restrictionCode === RestrictionCodeEnum.RstrMinLosThrough));
  }

  checkLSTValid(checkIn, checkOut): boolean {
    const lstList = this.getLST();
    if (lstList?.length > 0) {
      let result = true;

      for (const item of lstList) {
        const diffRange = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
        const diffLST = differenceInCalendarDays(DateUtils.safeDate(item?.date), new Date(checkIn));
        const lstValue = item?.priceOptionList[0]?.restrictionList
          ?.find(x => x?.restrictionCode === RestrictionCodeEnum.RstrMinLosThrough);

        if (diffLST >= 0 && isBefore(DateUtils.safeDate(item?.date), new Date(checkOut))) {
          // in case has 2 LST in date range selected
          const restrictionValue = lstValue?.restrictionValue?.includes('-')
            ? +lstValue?.restrictionValue?.split('-')?.shift()
            : +lstValue?.restrictionValue;
          result = diffRange >= restrictionValue;
        }
      }
      return result;
    }

    return true;
  }

  violateMaxLos(checkIn, checkOut): boolean {
    const maximumLos = this.calendarDailyRates
      ?.find(item => DateUtils.isSameDateOnCalendar(checkIn, item?.date))
      ?.priceOptionList?.map(x => x?.restrictionList?.find(y => y?.restrictionCode === RestrictionCodeEnum.RstrLosMax));

    const listLosValue = maximumLos?.map(x => +x?.restrictionValue) || [];
    const maximumLOSFound = Math.min(...listLosValue);

    const diffRange = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
    return !maximumLOSFound ? false : (diffRange > maximumLOSFound);
  }
}
