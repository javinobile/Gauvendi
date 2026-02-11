import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CalendarPriceLoadingComponent } from '@app/modules/site/components/calendar-price-loading/calendar-price-loading.component';
import { DateHoverDirective } from '@app/modules/site/directives/date-hover.directive';
import { DateTooltipDirective } from '@app/modules/site/directives/date-tooltip.directive';
import { DateRangeInvalidPipe } from '@app/modules/site/pages/recommendation/pipes/date-range-invalid.pipe';
import { RenderDailyPricePipe } from '@app/modules/site/pipes/render-daily-price.pipe';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { RenderNumberOfNightsTooltipPipe } from '@app/shared/pipes/render-number-of-nights-tooltip.pipe';
import { RenderTooltipMessagePipe } from '@app/shared/pipes/render-tooltip-message.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  CalendarDailyRate,
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
  selector: 'app-direct-calendar-renderer',
  standalone: true,
  imports: [
    CalendarPriceLoadingComponent,
    CommonModule,
    CurrencyRatePipe,
    CustomTooltipModule,
    DateHoverDirective,
    DateRangeInvalidPipe,
    DateTooltipDirective,
    FilterSvgDirective,
    MatIconModule,
    RenderDailyPricePipe,
    RenderNumberOfNightsTooltipPipe,
    RenderTooltipMessagePipe,
    TranslatePipe
  ],
  templateUrl: './direct-calendar-renderer.component.html',
  styleUrls: ['./direct-calendar-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DirectCalendarRendererComponent
  implements OnDestroy, OnInit, OnChanges
{
  private commonService = inject(CommonService);

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
  @Input() layoutSetting: string;
  @Input() locale: string;
  @Input() lowestPriceStayOption: StayOptionSuggestion;
  @Input() maxDate: Date;
  @Input() minDate: Date;
  @Input() selectedValue: Date[];

  @Output() clearSelectedDate = new EventEmitter();
  @Output() valueChange = new EventEmitter();

  MAX_COL = 7;
  MAX_ROW = 6;
  bodyRows: CalendarRow[] = [];
  isIncludedTax = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );
  destroyed$ = new Subject();

  constructor(private readonly configService: HotelConfigService) {}

  ngOnDestroy(): void {
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }

  ngOnInit(): void {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.bodyRows = this.makeBodyRows(this.activeDate);
  }

  onSelectedDate(cell: DateCell, isTouch: boolean = false): void {
    if (!isTouch && this.commonService.isMobile$.value) {
      return;
    }

    if (
      !cell.isDisable &&
      !cell.isHidden &&
      !cell.isCTA &&
      !cell.isCTD &&
      !cell.canNotCheckIn
    ) {
      const [from, to] = this.selectedValue;
      if (from && !to) {
        if (DateUtils.isSameDateOnCalendar(from, cell.value)) {
          this.clearSelectedDate.emit();
        } else {
          const isLOSValid = this.checkLOSValid(from, cell?.value);
          const isLSTValid = this.checkLSTValid(from, cell?.value);
          if (isLOSValid && isLSTValid) {
            this.valueChange.emit(cell.value);
          }
        }
      } else {
        this.valueChange.emit(cell.value);
      }
    }
  }

  onClearSelectedDate(event: Event, isTouch: boolean = false): void {
    if (!isTouch && this.commonService.isMobile$.value) {
      return;
    }

    event.stopPropagation();
    this.clearSelectedDate.emit();
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
          value: addDays(weekStart, day)
        };

        const [startSelected, endSelected] = this.selectedValue || [];

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
          DateUtils.isSameDateOnCalendar(
            item?.date,
            DateUtils.safeDate(tempDate?.value)
          )
        )?.priceOptionList;

        if (
          DateUtils.isAfter(tempDate.value, new Date()) &&
          priceOptionList?.[0]?.status !==
            CalendarPriceOptionStatus.CheckInUnavailable &&
          (priceOptionList?.length === 0 || !priceOptionList?.[0]?.grossPrice)
        ) {
          tempDate.isSoldOut = true;
        }

        if (
          DateUtils.isBefore(tempDate.value, this.minDate) ||
          DateUtils.isAfter(tempDate.value, this.maxDate) ||
          !(priceOptionList?.length > 0) ||
          (!priceOptionList?.[0]?.grossPrice &&
            priceOptionList?.[0]?.status !==
              CalendarPriceOptionStatus.CheckInUnavailable)
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
        DateUtils.isSameDateOnCalendar(from, item?.date)
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

  trackByBodyRow(index: number, item: CalendarRow) {
    return item.startDate.getDate();
  }

  trackByBodyColumn(index: number, item: DateCell) {
    return item.value.getDate();
  }
}
