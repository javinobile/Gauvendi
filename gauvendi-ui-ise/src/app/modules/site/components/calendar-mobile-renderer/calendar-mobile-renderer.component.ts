import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CalendarPriceLoadingComponent } from '@app/modules/site/components/calendar-price-loading/calendar-price-loading.component';
import { MobileDateSelectDirective } from '@app/modules/site/directives/mobile-date-select.directive';
import { IsSameDayPipe } from '@app/modules/site/pipes/is-same-day.pipe';
import { RenderDailyPricePipe } from '@app/modules/site/pipes/render-daily-price.pipe';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { DateWithLocalePipe } from '@app/shared/pipes/date-with-locale.pipe';
import { FormatPricePipe } from '@app/shared/pipes/format-price.pipe';
import { RenderNumberOfNightsTooltipPipe } from '@app/shared/pipes/render-number-of-nights-tooltip.pipe';
import { RenderTooltipMessagePipe } from '@app/shared/pipes/render-tooltip-message.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  CalendarDailyRate,
  CalendarPriceOptionLabel,
  CalendarPriceOptionStatus,
  HotelTaxSettingEnum,
  RestrictionCodeEnum,
  StayOptionSuggestion
} from '@core/graphql/generated/graphql';
import { CalendarRow, DateCell } from '@models/calendar.model';
import { DateUtils } from '@utils/DateUtils';
import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  isBefore,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-calendar-mobile-renderer',
  standalone: true,
  imports: [
    CalendarPriceLoadingComponent,
    CommonModule,
    CurrencyRatePipe,
    DateWithLocalePipe,
    FilterSvgDirective,
    FormatPricePipe,
    IsSameDayPipe,
    MatIconModule,
    MobileDateSelectDirective,
    RenderDailyPricePipe,
    RenderNumberOfNightsTooltipPipe,
    RenderTooltipMessagePipe,
    TranslatePipe
  ],
  templateUrl: './calendar-mobile-renderer.component.html',
  styleUrls: ['./calendar-mobile-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DecimalPipe]
})
export class CalendarMobileRendererComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() activeDate: Date;
  @Input() calendarDailyRates: CalendarDailyRate[];
  @Input() calendarSetting: {
    includeRate: boolean;
    includeRestriction: boolean;
  };
  @Input() checkInDateInfo: CalendarDailyRate;
  @Input() colorText: string;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() isLoadingPrice = false;
  @Input() isStartDate: boolean;
  @Input() layoutSetting: string;
  @Input() locale: string;
  @Input() lowestPriceOption: StayOptionSuggestion;
  @Input() maxDate: Date;
  @Input() minDate: Date;
  @Input() selectedValue: Date[];

  @Output() changeDate = new EventEmitter();
  @Output() clearSelectedDate = new EventEmitter();
  @Output() valueChange = new EventEmitter();

  MAX_COL = 7;
  MAX_ROW = 6;
  bodyRows: CalendarRow[] = [];
  isIncludedTax = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );
  destroyed$ = new Subject();

  violateMinLosDates: Date[] = [];
  dateViolated: Date;

  constructor(
    private readonly bookingTransactionService: BookingTransactionService,
    private readonly configService: HotelConfigService
  ) {}

  ngOnDestroy(): void {
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.bodyRows = this.makeBodyRows(this.activeDate);
  }

  onSelectedDate(cell: DateCell): void {
    if (
      !cell.isDisable &&
      !cell.isHidden &&
      !cell.isCTA &&
      !cell.isCTD &&
      !cell.canNotCheckIn
    ) {
      const [from, to] = this.selectedValue;
      if (from && to) {
        this.bookingTransactionService.dealInfo$.next(cell?.dealRestrictions);
      }
      if (from && !to) {
        if (DateUtils.isSameDateOnCalendar(from, cell.value)) {
          this.clearSelectedDate.emit();
          this.violateMinLosDates = [];
        } else {
          const isLOSValid = this.checkLOSValid(from, cell?.value);
          const isLSTValid = this.checkLSTValid(from, cell?.value);
          const isViolatedMaxLos = this.violateMaxLos(from, cell?.value);
          if (isLOSValid && isLSTValid && !isViolatedMaxLos) {
            this.valueChange.emit(cell.value);
          }
        }
      } else {
        const fromDate: Date = cell.value;
        this.valueChange.emit(fromDate);
        this.violateMinLosDates = [];
        const los = Math.max(
          ...this.calendarDailyRates
            ?.filter((item) =>
              DateUtils.isSameDateOnCalendar(
                item.date,
                DateUtils.safeDate(fromDate)
              )
            )?.[0]
            ?.priceOptionList?.[0]?.restrictionList?.filter(
              (rsrt) =>
                rsrt?.restrictionCode === RestrictionCodeEnum.RstrLosMin ||
                rsrt?.restrictionCode === RestrictionCodeEnum.RstrMinLosThrough
            )
            ?.map((rsrt) => +rsrt?.restrictionValue)
        );
        for (let idx = 1; idx < los; idx++) {
          this.violateMinLosDates.push(addDays(fromDate, idx));
        }
      }
    }
  }

  makeBodyRows(activeDate: Date): CalendarRow[] {
    const firstDayOfMonth = startOfWeek(startOfMonth(activeDate), {
      weekStartsOn: 1
    });
    const weekRows: CalendarRow[] = [];

    for (let week = 0; week < this.MAX_ROW; week++) {
      const weekStart = addWeeks(firstDayOfMonth, week);

      const dateCells: DateCell[] = [];
      for (let day = 0; day < this.MAX_COL; day++) {
        const nextDay = addDays(weekStart, day);
        const rate = this.calendarDailyRates?.find((item) =>
          DateUtils.isSameDateOnCalendar(
            item?.date,
            DateUtils.safeDate(nextDay)
          )
        );
        const dealOption = rate?.priceOptionList?.find(
          (x) => x?.label === CalendarPriceOptionLabel.Deal
        );
        const tempDate: DateCell = {
          isCTA: false,
          isCTD: false,
          isDisable: false,
          isInsideRange: false,
          isToday: false,
          isCheckIn: false,
          isCheckOut: false,
          isSoldOut: false,
          netPrice: rate?.priceOptionList[0]?.netPrice,
          grossPrice: rate?.priceOptionList[0]?.grossPrice,
          value: addDays(weekStart, day),
          dealPrice: dealOption?.price || null,
          dealRestrictions: {
            minLOS:
              +dealOption?.restrictionList?.find(
                (x) => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin
              )?.restrictionValue || null,
            maxLOS:
              +dealOption?.restrictionList?.find(
                (x) => x?.restrictionCode === RestrictionCodeEnum.RstrLosMax
              )?.restrictionValue || null
          },
          idxRow: day
        };

        const [startSelected, endSelected] = this.selectedValue || [];

        if (DateUtils.isSameDateOnCalendar(tempDate.value, startSelected)) {
          this.bookingTransactionService.dealInfo$.next(
            tempDate?.dealRestrictions
          );
        }

        if (isToday(DateUtils.safeDate(tempDate.value))) {
          tempDate.isToday = true;
        }

        if (
          startSelected &&
          endSelected &&
          DateUtils.isSameOrAfter(tempDate?.value, startSelected) &&
          DateUtils.isSameOrBefore(tempDate?.value, endSelected)
        ) {
          tempDate.isInsideRange = true;
        }

        if (!isSameMonth(DateUtils.safeDate(tempDate.value), activeDate)) {
          tempDate.isHidden = true;
        }

        if (DateUtils.isBefore(tempDate.value, addDays(new Date(), -1))) {
          tempDate.grossPrice = null;
          tempDate.netPrice = null;
        }

        const priceOptionList = this.calendarDailyRates?.find((item) =>
          DateUtils.isSameDateOnCalendar(item?.date, tempDate?.value)
        )?.priceOptionList;

        if (
          (DateUtils.isAfter(tempDate.value, new Date()) &&
            !(priceOptionList?.length > 0)) ||
          (priceOptionList?.[0]?.status === CalendarPriceOptionStatus.Default &&
            !priceOptionList?.[0]?.grossPrice)
        ) {
          tempDate.isSoldOut = true;
        }

        if (
          DateUtils.isBefore(tempDate.value, this.minDate) ||
          DateUtils.isAfter(tempDate.value, this.maxDate) ||
          !(priceOptionList?.length > 0) ||
          (!priceOptionList?.[0]?.grossPrice &&
            priceOptionList?.[0]?.status === CalendarPriceOptionStatus.Default)
        ) {
          // if checkin
          const [from] = this.selectedValue;

          tempDate.isDisable = !(
            from &&
            DateUtils.isSameDateOnCalendar(
              tempDate?.value,
              DateUtils.safeDate(this.maxDate)
            )
          );
        }

        if (
          DateUtils.isSameDateOnCalendar(tempDate.value, startSelected) ||
          DateUtils.isSameDateOnCalendar(tempDate.value, endSelected)
        ) {
          tempDate.isSelected = true;
        }

        if (DateUtils.isSameDateOnCalendar(tempDate.value, startSelected)) {
          tempDate.isCheckIn = true;
        }

        if (DateUtils.isSameDateOnCalendar(tempDate.value, endSelected)) {
          tempDate.isCheckOut = true;
        }

        if (
          DateUtils.isAfter(tempDate.value, startSelected) &&
          DateUtils.isBefore(tempDate.value, endSelected)
        ) {
          tempDate.isHover = true;
        }

        if (this.calendarDailyRates?.length > 0) {
          const restrictionList = priceOptionList?.[0]?.restrictionList;
          const [from, to] = this.selectedValue;
          if (!from) {
            // case date range is empty
            tempDate.isCTA = !!restrictionList?.find(
              (item) =>
                item?.restrictionCode === RestrictionCodeEnum.RstrCloseToArrival
            );
            tempDate.isCTD = false; // set CTD is false to select check-in date
            tempDate.canNotCheckIn =
              !!rate?.priceOptionList?.find(
                (x) =>
                  x?.status === CalendarPriceOptionStatus.CheckInUnavailable
              ) ||
              !!restrictionList?.find(
                (item) =>
                  item?.restrictionCode ===
                  RestrictionCodeEnum.RstrCloseToArrival
              );
          } else {
            if (!to) {
              // select checkout
              tempDate.isCTA =
                !!restrictionList?.find(
                  (item) =>
                    item?.restrictionCode ===
                    RestrictionCodeEnum.RstrCloseToArrival
                ) && DateUtils.isSameDateOnCalendar(tempDate?.value, from);
              tempDate.isCTD =
                !!restrictionList?.find(
                  (item) =>
                    item?.restrictionCode ===
                    RestrictionCodeEnum.RstrCloseToDeparture
                ) && !DateUtils.isSameDateOnCalendar(tempDate?.value, from); // CTD date must not be check-in date
              tempDate.canNotCheckIn = false;
            } else {
              // select checkin && date range is not empty
              tempDate.isCTA = !!restrictionList?.find(
                (item) =>
                  item?.restrictionCode ===
                  RestrictionCodeEnum.RstrCloseToArrival
              );
              tempDate.canNotCheckIn =
                !!rate?.priceOptionList?.find(
                  (x) =>
                    x?.status === CalendarPriceOptionStatus.CheckInUnavailable
                ) ||
                !!restrictionList?.find(
                  (item) =>
                    item?.restrictionCode ===
                    RestrictionCodeEnum.RstrCloseToArrival
                );
            }
          }

          tempDate.isStayIn =
            !!restrictionList?.find(
              (item) =>
                item?.restrictionCode === RestrictionCodeEnum.RstrCloseToArrival
            ) &&
            !!restrictionList?.find(
              (item) =>
                item?.restrictionCode ===
                RestrictionCodeEnum.RstrCloseToDeparture
            );
        }

        if (!isSameMonth(tempDate.value, activeDate)) {
          tempDate.isHidden = true;
        }

        dateCells.push(tempDate);
      }
      weekRows.push({
        startDate: weekStart,
        dateCells,
        isSameMonth: isSameMonth(weekStart, startOfMonth(activeDate))
      });
    }
    return weekRows;
  }

  getLST(): CalendarDailyRate[] {
    return this.calendarDailyRates?.filter((x) =>
      x?.priceOptionList[0]?.restrictionList?.find(
        (y) => y?.restrictionCode === RestrictionCodeEnum.RstrMinLosThrough
      )
    );
  }

  checkLOSValid(from: Date, to: Date): boolean {
    const los = this.calendarDailyRates?.filter((item) => {
      return (
        item?.priceOptionList[0]?.restrictionList?.length > 0 &&
        item?.priceOptionList[0]?.restrictionList?.find(
          (x) => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin
        ) &&
        DateUtils.isSameDateOnCalendar(from, DateUtils.safeDate(item?.date))
      );
    });

    if (los?.length > 0) {
      const listLosValue: number[] = los
        .reduce((p, c) => {
          return p.concat(
            c?.priceOptionList[0]?.restrictionList
              ?.filter(
                (x) => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin
              )
              .map((y) => y?.restrictionValue)
          );
        }, [])
        .map((x) => +x);

      if (listLosValue?.length > 0) {
        const maximumLOS = Math.max(...listLosValue);

        const diffRange = differenceInCalendarDays(
          new Date(to),
          new Date(from)
        );

        return diffRange >= maximumLOS;
      }
    }

    return true;
  }

  checkLSTValid(checkIn, checkOut): boolean {
    const lstList = this.getLST();
    let result = true;

    for (const item of lstList) {
      const diffRange = differenceInCalendarDays(
        new Date(checkOut),
        new Date(checkIn)
      );
      const diffLST = differenceInCalendarDays(
        DateUtils.safeDate(item?.date),
        new Date(checkIn)
      );
      const lstValue = item?.priceOptionList[0]?.restrictionList?.find(
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
        result = diffRange >= restrictionValue;
      }
    }
    return result;
  }

  violateMaxLos(checkIn, checkOut): boolean {
    let checkInOptList = this.calendarDailyRates?.find((item) =>
      DateUtils.isSameDateOnCalendar(DateUtils.safeDate(checkIn), item?.date)
    )?.priceOptionList;
    if (checkInOptList?.length > 1) {
      checkInOptList = checkInOptList?.filter(
        (item) => item?.label === CalendarPriceOptionLabel.Default
      );
    }

    let maximumLos = checkInOptList?.map((x) =>
      x?.restrictionList?.find(
        (y) => y?.restrictionCode === RestrictionCodeEnum.RstrLosMax
      )
    );

    const listLosValue = maximumLos?.map((x) => +x?.restrictionValue) || [];
    const maximumLOSFound = Math.min(...listLosValue);

    const diffRange = differenceInCalendarDays(
      new Date(checkOut),
      new Date(checkIn)
    );
    return !maximumLOSFound ? false : diffRange > maximumLOSFound;
  }

  trackByBodyRow(index: number, item: CalendarRow) {
    return item.startDate.getDate();
  }

  trackByBodyColumn(index: number, item: DateCell) {
    return item.value.getDate();
  }
}
