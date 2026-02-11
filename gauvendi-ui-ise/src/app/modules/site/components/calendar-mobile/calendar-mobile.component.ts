import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { CalendarMobileRendererComponent } from '@app/modules/site/components/calendar-mobile-renderer/calendar-mobile-renderer.component';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  CalendarDailyRate,
  CalendarPriceOptionStatus,
  RestrictionCodeEnum
} from '@core/graphql/generated/graphql';
import { ELoadingStatus } from '@models/loading-status.model';
import { select, Store } from '@ngrx/store';
import {
  loadCalendar,
  resetCalendarWithCheckin
} from '@store/calendar/calendar.actions';
import {
  selectorCalendarDailyRateList,
  selectorCalendarDailyRateListStatus
} from '@store/calendar/calendar.selectors';
import { selectorHotelRate } from '@store/hotel/hotel.selectors';
import { selectorLowestPriceStayOption } from '@store/suggestion/suggestion.selectors';
import { DateUtils } from '@utils/DateUtils';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfMonth
} from 'date-fns';
import * as moment from 'moment/moment';
import { map, skipWhile, tap } from 'rxjs/operators';

@Component({
  selector: 'app-calendar-mobile',
  standalone: true,
  imports: [
    CalendarMobileRendererComponent,
    CommonModule,
    FilterSvgDirective,
    MatExpansionModule,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './calendar-mobile.component.html',
  styleUrls: ['./calendar-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarMobileComponent implements OnInit {
  @Output() onBack = new EventEmitter();

  activeDate = [
    startOfMonth(new Date()),
    startOfMonth(addMonths(new Date(), 1))
  ];
  calendarDailyRateList: CalendarDailyRate[] = [];
  checkInDateInfo: CalendarDailyRate;
  datesSelected: Date[] = [null, null];
  isIOS = /iPhone|iPod|iPad/.test(navigator.userAgent);
  maxDate = null;
  minDate = addDays(new Date(), -1);
  violateLOS: Date[] = [];

  calendarDailyRates$ = this.store.pipe(
    select(selectorCalendarDailyRateList),
    skipWhile((data) => !data),
    tap((data) => {
      this.calendarDailyRateList = data;
      // get max checkout Date
      const checkIn = this.bookingTransactionService.dateSelected$?.value?.from;
      const checkOut = this.bookingTransactionService.dateSelected$?.value?.to;

      if (!checkIn) {
        this.maxDate = null;
        this.checkInDateInfo = null;
      }

      if (checkIn && !checkOut) {
        this.checkLOSValid(
          parse(
            this.bookingTransactionService.dateSelected$?.value?.from,
            'dd-MM-yyyy',
            new Date()
          )
        );
        this.maxDate = this.bookingTransactionService.dateSelected$?.value?.from
          ? this.getMaxCheckoutDate(
              parse(
                this.bookingTransactionService.dateSelected$?.value?.from,
                'dd-MM-yyyy',
                new Date()
              )
            )
          : null;
        this.checkInDateInfo = this.calendarDailyRateList.find(
          (x) =>
            moment(x?.date).format('DD-MM-yyyy') ===
            this.bookingTransactionService.dateSelected$?.value?.from
        );
      }
    })
  );

  isLoadingCalendar$ = this.store.pipe(
    select(selectorCalendarDailyRateListStatus),
    map((status) => status === ELoadingStatus.loading)
  );

  locale$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang])
  );

  currencyCode$ = this.store.pipe(select(selectorCurrencyCodeSelected));
  currencyRate$ = this.store.pipe(select(selectorHotelRate));
  lowestPriceOption$ = this.store.pipe(select(selectorLowestPriceStayOption));

  calendarSetting$ = this.hotelConfigService.calendarSetting$;
  layoutSetting$ = this.hotelConfigService.layoutSetting$;
  colorText$ = this.hotelConfigService.colorText$;

  constructor(
    private bookingTransactionService: BookingTransactionService,
    private hotelConfigService: HotelConfigService,
    private route: ActivatedRoute,
    private store: Store
  ) {}

  ngOnInit(): void {
    const checkInDate =
      this.bookingTransactionService.dateSelected$?.value?.from ||
      this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate];
    const dateStartOfCalendar = parse(checkInDate, 'dd-MM-yyyy', new Date());

    const checkOutDate =
      this.bookingTransactionService.dateSelected$?.value?.to ||
      this.route.snapshot.queryParams[RouteKeyQueryParams.checkOutDate];
    const dateEndOfCalendar = parse(checkOutDate, 'dd-MM-yyyy', new Date());

    if (isValid(dateStartOfCalendar)) {
      this.activeDate = [
        startOfMonth(dateStartOfCalendar),
        startOfMonth(addMonths(dateStartOfCalendar, 1))
      ];
    }

    if (isValid(dateStartOfCalendar) && isValid(dateEndOfCalendar)) {
      this.datesSelected = [dateStartOfCalendar, dateEndOfCalendar];
    }

    this.loadCalendarDirectRoomProduct();
  }

  changeDate(type: string): void {
    this.activeDate =
      type === 'left'
        ? [addMonths(this.activeDate[0], -1), this.activeDate[0]]
        : [this.activeDate[1], addMonths(this.activeDate[1], 1)];

    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    const fromTime = startOfMonth(this.activeDate[0]);
    const toTime = endOfMonth(addMonths(this.activeDate[0], 1));
    const promoCode = this.bookingTransactionService.promoCode$?.value;

    const { adult, children } = this.bookingTransactionService.getAdults(
      this.bookingTransactionService?.travelerSelected$?.value
    );

    // find caching
    const isExistedFromTime = !!this.calendarDailyRateList?.find(
      (x) =>
        moment(fromTime).format('MM yyyy') === moment(x?.date).format('MM yyyy')
    );
    const isExistedToTime = !!this.calendarDailyRateList?.find(
      (x) =>
        moment(toTime).format('MM yyyy') === moment(x?.date).format('MM yyyy')
    );

    this.store.dispatch(
      loadCalendar({
        variables: {
          propertyCode: hotelCode,
          fromDate: moment(new Date(fromTime))?.format('yyyy-MM-DD'),
          toDate: moment(new Date(toTime))?.format('yyyy-MM-DD'),
          totalAdult: adult,
          childAgeList: children,
          promoCode
        },
        cachingTime: null
      })
    );

    // if (!isExistedFromTime && !isExistedToTime) {
    //   this.store.dispatch(
    //     loadCalendar({
    //       variables: {
    //         propertyCode: hotelCode,
    //         fromDate: moment(new Date(fromTime))?.format('yyyy-MM-DD'),
    //         toDate: moment(new Date(toTime))?.format('yyyy-MM-DD'),
    //         totalAdult: adult,
    //         childAgeList: children,
    //         promoCode,
    //       },
    //       cachingTime: null,
    //     })
    //   );
    // } else {
    //   if (!isExistedToTime) {
    //     this.store.dispatch(
    //       loadCalendar({
    //         variables: {
    //           propertyCode: hotelCode,
    //           fromDate: moment(startOfMonth(toTime))?.format('yyyy-MM-DD'),
    //           toDate: moment(endOfMonth(toTime))?.format('yyyy-MM-DD'),
    //           totalAdult: adult,
    //           childAgeList: children,
    //           promoCode,
    //         },
    //         cachingTime: moment(fromTime).format('yyyy-MM-DD'),
    //       })
    //     );
    //   } else {
    //     this.store.dispatch(
    //       loadCalendar({
    //         variables: {
    //           propertyCode: hotelCode,
    //           fromDate: moment(startOfMonth(fromTime))?.format('yyyy-MM-DD'),
    //           toDate: moment(endOfMonth(fromTime))?.format('yyyy-MM-DD'),
    //           totalAdult: adult,
    //           childAgeList: children,
    //           promoCode,
    //         },
    //         cachingTime: moment(toTime).format('yyyy-MM-DD'),
    //       })
    //     );
    //   }
    // }
  }

  selectedChange(selectedDate: Date): void {
    const isValidRate =
      this.calendarDailyRateList &&
      this.calendarDailyRateList?.find((x) =>
        DateUtils.isSameDateOnCalendar(
          x?.date,
          DateUtils.safeDate(selectedDate)
        )
      )?.priceOptionList?.length > 0;
    const [from, to] = this.datesSelected;
    if (!from && !isValidRate) {
      return;
    }

    if (to && !isValidRate) {
      this.datesSelected = [null, null];
      this.checkInDateInfo = null;
      return;
    }

    if (!from) {
      // case clear date range and select again
      this.datesSelected = [selectedDate, null];
      this.minDate = selectedDate;
      this.maxDate = this.getMaxCheckoutDate(selectedDate);
      // check LOS
      this.checkLOSValid(selectedDate);
      this.checkInDateInfo = this.calendarDailyRateList?.find((x) =>
        DateUtils.isSameDateOnCalendar(
          x?.date,
          DateUtils.safeDate(selectedDate)
        )
      );
    } else {
      if (isSameDay(from, selectedDate)) {
        if (to) {
          this.datesSelected = [selectedDate, null];
          this.maxDate = this.getMaxCheckoutDate(selectedDate);
          this.checkLOSValid(selectedDate);
          this.checkInDateInfo = this.calendarDailyRateList?.find((x) =>
            DateUtils.isSameDateOnCalendar(
              x?.date,
              DateUtils.safeDate(selectedDate)
            )
          );
        } else {
          this.datesSelected = [null, null];
          this.minDate = addDays(new Date(), -1);
          this.maxDate = null;
          this.checkInDateInfo = null;
        }
      } else {
        if (from && to) {
          // case having date range and select again
          this.datesSelected = [selectedDate, null];
          this.minDate = selectedDate;
          this.maxDate = this.getMaxCheckoutDate(selectedDate);
          // check LOS
          this.checkLOSValid(selectedDate);
          this.checkInDateInfo = this.calendarDailyRateList?.find((x) =>
            DateUtils.isSameDateOnCalendar(
              x?.date,
              DateUtils.safeDate(selectedDate)
            )
          );
        } else {
          if (isBefore(selectedDate, from)) {
            if (
              isSameDay(selectedDate, new Date()) ||
              isAfter(selectedDate, new Date())
            ) {
              this.datesSelected = [selectedDate, null];
              this.minDate = selectedDate;
              this.maxDate = this.getMaxCheckoutDate(selectedDate);
              this.checkInDateInfo = this.calendarDailyRateList?.find((x) =>
                DateUtils.isSameDateOnCalendar(
                  x?.date,
                  DateUtils.safeDate(selectedDate)
                )
              );
            }
          } else {
            this.datesSelected = [from, selectedDate];
            this.minDate = addDays(new Date(), -1);
            this.maxDate = null;
          }
        }
      }
    }

    this.bookingTransactionService.dateSelected$.next({
      from:
        (this.datesSelected[0] &&
          format(this.datesSelected[0], 'dd-MM-yyyy')) ||
        null,
      to:
        (this.datesSelected[1] &&
          format(this.datesSelected[1], 'dd-MM-yyyy')) ||
        null
    });
  }

  getMaxCheckoutDate(checkIn: Date): Date {
    if (this.calendarDailyRateList?.length > 0) {
      const checkOut = this.calendarDailyRateList
        ?.filter((x) => DateUtils.isAfter(x?.date, checkIn))
        ?.find((x) => {
          return (
            !(x?.priceOptionList?.length > 0) ||
            (x?.priceOptionList?.[0]?.status ===
              CalendarPriceOptionStatus.Default &&
              !x?.priceOptionList?.[0]?.grossPrice)
          );
        });

      return checkOut ? moment(checkOut?.date).toDate() : null;
    }

    return null;
  }

  checkLOSValid(checkInDate: Date): void {
    this.violateLOS = [];
    if (this.calendarDailyRateList?.length > 0) {
      const restrictionLOS = +this.calendarDailyRateList
        .find((x) =>
          DateUtils.isSameDateOnCalendar(new Date(x?.date), checkInDate)
        )
        ?.priceOptionList[0]?.restrictionList?.find(
          (x) => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin
        )?.restrictionValue;
      if (restrictionLOS) {
        for (let i = 1; i < restrictionLOS; i++) {
          this.violateLOS.push(addDays(checkInDate, i));
        }
      }
    }
  }

  clearSelectedDate(): void {
    this.datesSelected = [null, null];
    this.minDate = addDays(new Date(), -1);
    this.maxDate = null;
    this.bookingTransactionService.dateSelected$?.next({
      from: null,
      to: null
    });
    this.store.dispatch(resetCalendarWithCheckin());
  }

  loadCalendarDirectRoomProduct(): void {
    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    const checkInDate =
      this.bookingTransactionService.dateSelected$?.value?.from ||
      queryParams[RouteKeyQueryParams.checkInDate];

    let dateStartOfCalendar: Date = new Date();
    let fromTime: Date;
    let toTime: Date;

    try {
      dateStartOfCalendar = parse(checkInDate, 'dd-MM-yyyy', new Date());
    } catch (e) {
      console.error(e);
    } finally {
      fromTime = isValid(dateStartOfCalendar)
        ? isSameMonth(dateStartOfCalendar, new Date())
          ? new Date()
          : startOfMonth(dateStartOfCalendar)
        : new Date();
      toTime = isValid(dateStartOfCalendar)
        ? endOfMonth(addMonths(dateStartOfCalendar, 1))
        : endOfMonth(addMonths(new Date(), 1));

      const { adult, children } = this.bookingTransactionService.getAdults(
        this.bookingTransactionService?.travelerSelected$?.value
      );

      const promoCode = this.bookingTransactionService.promoCode$?.value;

      this.store.dispatch(
        loadCalendar({
          variables: {
            propertyCode: hotelCode,
            fromDate: moment(new Date(fromTime))?.format('yyyy-MM-DD'),
            toDate: moment(new Date(toTime))?.format('yyyy-MM-DD'),
            totalAdult: adult,
            childAgeList: children,
            promoCode: promoCode ? promoCode : null
          },
          cachingTime: null
        })
      );
    }
  }

  onBackClick(): void {
    this.bookingTransactionService.dateSelected$.next({
      from: this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate],
      to: this.route.snapshot.queryParams[RouteKeyQueryParams.checkOutDate]
    });
    this.onBack.emit();
  }
}
