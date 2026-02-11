import {Directive, ElementRef, HostListener, Input, Renderer2} from '@angular/core';
import {CalendarDailyRate, RestrictionCodeEnum} from "@core/graphql/generated/graphql";
import {DateUtils} from "@utils/DateUtils";
import {differenceInCalendarDays, isBefore, isSameDay} from "date-fns";

@Directive({
  selector: '[appDateHover]',
  standalone: true
})
export class DateHoverDirective {
  @Input() checkInDate: Date;
  @Input() checkOutDate: Date;
  @Input() dateHover: Date;
  @Input() calendarDailyRates: CalendarDailyRate[];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
  }

  @HostListener('mouseenter') onMouseEnter() {
    if (this.checkInDate && !isSameDay(this.checkInDate, this.dateHover) && !this.checkOutDate && (
      !this.checkLOSValid(this.checkInDate, this.dateHover)
      || !this.checkLSTValid(this.checkInDate, this.dateHover))
    ) {
      this.renderer.addClass(this.el.nativeElement, 'violated');
    } else {
      this.renderer.addClass(this.el.nativeElement, 'hovered');
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.removeClass(this.el.nativeElement, 'hovered');
    this.renderer.removeClass(this.el.nativeElement, 'violated');
  }

  checkLOSValid(from: Date, to: Date): boolean {
    const los = this.calendarDailyRates?.filter(item => {
      return item?.priceOptionList[0]?.restrictionList?.length > 0
        && item?.priceOptionList[0]
          ?.restrictionList?.find(x => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin)
        && DateUtils.isSameDateOnCalendar(from, item?.date);
    });

    if (los?.length > 0) {
      const listLosValue: number[] = los.reduce((p, c) => {
        return p.concat(c?.priceOptionList[0]
          ?.restrictionList?.filter(x => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin)
          ?.map(y => y?.restrictionValue));
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
}
