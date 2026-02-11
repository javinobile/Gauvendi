import { animate, style, transition, trigger } from '@angular/animations';
import { A11yModule } from '@angular/cdk/a11y';
import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { CalendarRendererComponent } from '@app/modules/site/components/calendar-renderer/calendar-renderer.component';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { CartService } from '@app/services/cart.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SearchBarHandlerService } from '@app/services/search-bar-handler.service';
import { TrackingService } from '@app/services/tracking.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { DateWithLocalePipe } from '@app/shared/pipes/date-with-locale.pipe';
import { RenderIndicatePricePipe } from '@app/shared/pipes/render-indicate-price.pipe';
import { RenderSummaryDatePipe } from '@app/shared/pipes/render-summary-date.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  CalendarDailyRate,
  CalendarPriceOptionLabel,
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
import * as moment from 'moment';
import { BehaviorSubject, Subject } from 'rxjs';
import { map, skipWhile, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-calendar-overlay',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    DateWithLocalePipe,
    CalendarRendererComponent,
    RenderIndicatePricePipe,
    RenderSummaryDatePipe,
    TranslatePipe,
    FilterSvgDirective,
    A11yModule
  ],
  templateUrl: './calendar-overlay.component.html',
  styleUrls: ['./calendar-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [animate('500ms', style({ opacity: 0 }))])
    ])
  ]
})
export class CalendarOverlayComponent implements OnInit, OnDestroy {
  overlayRef: OverlayRef;
  locale$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang])
  );
  currencyCode$ = this.store.pipe(select(selectorCurrencyCodeSelected));
  currencyRate$ = this.store.pipe(select(selectorHotelRate));

  calendarDailyRates$ = this.store.pipe(
    select(selectorCalendarDailyRateList),
    skipWhile((data) => !data),
    tap((data) => {
      this.calendarDailyRateList = data;
      const checkInDateFromQueryParam =
        this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate];
      const checkOutDateFromQueryParam =
        this.route.snapshot.queryParams[RouteKeyQueryParams.checkOutDate];
      // check isGotDeal
      if (checkInDateFromQueryParam && checkOutDateFromQueryParam) {
        const dealOption = this.calendarDailyRateList
          ?.find((x) =>
            DateUtils.isSameDateOnCalendar(
              x?.date,
              parse(checkInDateFromQueryParam, 'dd-MM-yyyy', new Date())
            )
          )
          ?.priceOptionList?.find(
            (x) => x?.label === CalendarPriceOptionLabel.Deal
          );
        if (dealOption) {
          this.isGotDeal =
            Math.abs(
              moment(parse(checkInDateFromQueryParam, 'dd-MM-yyyy', new Date()))
                .startOf('dates')
                .diff(
                  moment(
                    parse(checkOutDateFromQueryParam, 'dd-MM-yyyy', new Date())
                  ).startOf('dates'),
                  'days'
                )
            ) >=
            +dealOption?.restrictionList.find(
              (x) => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin
            )?.restrictionValue;
        }
      }

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

  // calendarCheckin$ = this.store.pipe(
  //   select(selectorCalendarRateCheckIn)
  // );

  // calendarRateCombine$ = combineLatest([
  //   this.calendarDailyRates$,
  //   this.calendarCheckin$
  // ]).pipe(
  //   skipWhile(([calendar, _]) => !calendar),
  //   map(([calendarOrigin, calendarModify]) => {
  //
  //     let modifyRate =  calendarOrigin;
  //     if (calendarOrigin && calendarModify) {
  //       modifyRate = calendarOrigin?.map(item => {
  //         const found = calendarModify?.find(x => x?.date === item?.date);
  //         return found || item;
  //       });
  //     }
  //
  //     return modifyRate;
  //   }),
  //   tap(data => {
  //     this.calendarDailyRateList = data;
  //     const checkInDateFromQueryParam = this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate];
  //     const checkOutDateFromQueryParam = this.route.snapshot.queryParams[RouteKeyQueryParams.checkOutDate];
  //     // check isGotDeal
  //     if (checkInDateFromQueryParam && checkOutDateFromQueryParam) {
  //       const dealOption = this.calendarDailyRateList
  //         ?.find(x => DateUtils.isSameDateOnCalendar(x?.date, parse(checkInDateFromQueryParam, 'dd-MM-yyyy', new Date())))
  //         ?.priceOptionList?.find(x => x?.label === CalendarPriceOptionLabel.Deal);
  //       if (dealOption) {
  //         this.isGotDeal = Math.abs(moment(parse(checkInDateFromQueryParam, 'dd-MM-yyyy', new Date())).startOf('dates').diff(moment(parse(checkOutDateFromQueryParam, 'dd-MM-yyyy', new Date())).startOf('dates'), 'days')) >= +dealOption?.restrictionList.find(x => x?.restrictionCode === RestrictionCodeEnum.RstrLosMin)?.restrictionValue;
  //       }
  //     }
  //
  //     // get max checkout Date
  //     const checkIn = this.bookingTransactionService.dateSelected$?.value?.from;
  //     const checkOut = this.bookingTransactionService.dateSelected$?.value?.to;
  //
  //     if (!checkIn) {
  //       this.maxDate = null;
  //       this.checkInDateInfo = null;
  //     }
  //
  //     if (checkIn && !checkOut) {
  //       this.checkLOSValid(parse(this.bookingTransactionService.dateSelected$?.value?.from, 'dd-MM-yyyy', new Date()));
  //       this.maxDate = this.bookingTransactionService.dateSelected$?.value?.from ? this.getMaxCheckoutDate(parse(this.bookingTransactionService.dateSelected$?.value?.from, 'dd-MM-yyyy', new Date())) : null;
  //       this.checkInDateInfo = this.calendarDailyRateList.find(x => moment(x?.date).format('DD-MM-yyyy') === this.bookingTransactionService.dateSelected$?.value?.from);
  //     }
  //   })
  // );

  isLoadingCalendar$ = this.store.pipe(
    select(selectorCalendarDailyRateListStatus),
    map((status) => status === ELoadingStatus.loading)
  );
  lowestPriceOption$ = this.store.pipe(select(selectorLowestPriceStayOption));

  travelerSelected$ = this.bookingTransactionService.travelerSelected$;
  value$ = new BehaviorSubject<any>(null);
  destroyed$ = new Subject();
  themeColors$ = this.hotelConfigService.themeColors$;

  activeDate = [
    startOfMonth(new Date()),
    startOfMonth(addMonths(new Date(), 1))
  ];
  datesSelected: Date[] = [null, null];
  minDate = addDays(new Date(), -1);
  maxDate = null;
  calendarDailyRateList: CalendarDailyRate[] = [];
  violateLOS: Date[] = [];
  minLOS = null;
  maxLOS = null;
  isGotDeal = false;
  isMonthChanged = false;
  checkInDateInfo: CalendarDailyRate;
  configuratorService = inject(ConfiguratorService);
  calendarSetting$ = this.hotelConfigService.calendarSetting$;
  layoutSetting$ = this.hotelConfigService.layoutSetting$;

  constructor(
    private route: ActivatedRoute,
    private bookingTransactionService: BookingTransactionService,
    private store: Store,
    private searchBarHandlerService: SearchBarHandlerService,
    private trackingService: TrackingService,
    private hotelConfigService: HotelConfigService,
    private readonly cartService: CartService
  ) {}

  ngOnDestroy(): void {
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    const checkInDate =
      this.bookingTransactionService.dateSelected$?.value?.from;
    const dateStartOfCalendar = checkInDate
      ? parse(checkInDate, 'dd-MM-yyyy', new Date())
      : null;

    const checkOutDate =
      this.bookingTransactionService.dateSelected$?.value?.to;
    const dateEndOfCalendar = checkOutDate
      ? parse(checkOutDate, 'dd-MM-yyyy', new Date())
      : null;

    if (isValid(dateStartOfCalendar)) {
      this.activeDate = [
        startOfMonth(dateStartOfCalendar),
        startOfMonth(addMonths(dateStartOfCalendar, 1))
      ];
    }

    this.datesSelected = [dateStartOfCalendar, dateEndOfCalendar];

    this.loadCalendarDirectRoomProduct();
    // if (this.bookingTransactionService.dateSelected$?.value?.from) {
    //   this.loadCalendarCheckIn();
    // }
    // this.suggestionHandlerService.loadLowestStayOption();

    this.bookingTransactionService.dealInfo$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.minLOS = data?.minLOS;
        this.maxLOS = data?.maxLOS;
      });
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
    //   this.store.dispatch(loadCalendar({
    //     variables: {
    //       propertyCode: hotelCode,
    //       fromDate: moment(new Date(fromTime))?.format('yyyy-MM-DD'),
    //       toDate: moment(new Date(toTime))?.format('yyyy-MM-DD'),
    //       totalAdult: adult,
    //       childAgeList: children,
    //       promoCode
    //     },
    //     cachingTime: null
    //   }));
    // } else {
    //   if (!isExistedToTime) {
    //     this.store.dispatch(loadCalendar({
    //       variables: {
    //         propertyCode: hotelCode,
    //         fromDate: moment(startOfMonth(toTime))?.format('yyyy-MM-DD'),
    //         toDate: moment(endOfMonth(toTime))?.format('yyyy-MM-DD'),
    //         totalAdult: adult,
    //         childAgeList: children,
    //         promoCode
    //       },
    //       cachingTime: moment(fromTime).format('yyyy-MM-DD')
    //     }));
    //   } else {
    //     this.store.dispatch(loadCalendar({
    //       variables: {
    //         propertyCode: hotelCode,
    //         fromDate: moment(startOfMonth(fromTime))?.format('yyyy-MM-DD'),
    //         toDate: moment(endOfMonth(fromTime))?.format('yyyy-MM-DD'),
    //         totalAdult: adult,
    //         childAgeList: children,
    //         promoCode
    //       },
    //       cachingTime: moment(toTime).format('yyyy-MM-DD')
    //     }));
    //   }
    // }

    this.isMonthChanged = true;
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
            if (this.minLOS > 0) {
              this.isGotDeal =
                Math.abs(
                  moment(new Date(from))
                    .startOf('dates')
                    .diff(
                      moment(new Date(selectedDate)).startOf('dates'),
                      'days'
                    )
                ) >= this.minLOS;
            }
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

    // if (this.datesSelected[0]) {
    //   this.loadCalendarCheckIn();
    // }

    // get lowest stayOption
    // this.suggestionHandlerService.loadLowestStayOption();
  }

  getMaxCheckoutDate(checkIn: Date): Date {
    if (this.calendarDailyRateList?.length > 0) {
      // check MaxLOS
      const findMaxLOS = this.calendarDailyRateList
        ?.find((x) =>
          DateUtils.isSameDateOnCalendar(x?.date, DateUtils.safeDate(checkIn))
        )
        ?.priceOptionList[0]?.restrictionList?.find(
          (y) => y?.restrictionCode === RestrictionCodeEnum.RstrLosMax
        );
      if (findMaxLOS) {
        const maxCheckOut = moment(DateUtils.safeDate(checkIn)).add(
          +findMaxLOS?.restrictionValue,
          'days'
        );
        const checkOut = this.calendarDailyRateList
          ?.filter(
            (x) =>
              DateUtils.isAfter(x?.date, DateUtils.safeDate(checkIn)) &&
              DateUtils.isSameOrBefore(x?.date, maxCheckOut.toDate())
          )
          ?.find((x) => {
            return (
              !(x?.priceOptionList?.length > 0) ||
              (x?.priceOptionList?.[0]?.status ===
                CalendarPriceOptionStatus.Default &&
                !x?.priceOptionList?.[0]?.grossPrice)
            );
          });
        return checkOut
          ? moment(checkOut?.date).toDate()
          : maxCheckOut?.toDate();
      } else {
        const checkOut = this.calendarDailyRateList
          ?.filter((x) =>
            DateUtils.isAfter(x?.date, DateUtils.safeDate(checkIn))
          )
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

  loadCalendarDirectRoomProduct(): void {
    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    const checkInDate =
      this.bookingTransactionService.dateSelected$?.value?.from ||
      this.activeDate?.[0];

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

  onDone(): void {
    this.onTrack();
    this.searchBarHandlerService.openOverlayState$.next(null);
    this.overlayRef?.detach();
    this.value$.next('apply');
    this.configuratorService.isCollapse.set(true);
  }

  onPickFeature(): void {
    this.onTrack();
    this.searchBarHandlerService.openOverlayState$.next(null);
    this.overlayRef?.detach();
    // this.value$.next('apply');
    this.configuratorService.isCollapse.set(false);
    this.configuratorService.minimalView.set(false);
  }

  onTrack(): void {
    const dateSelected = this.bookingTransactionService.dateSelected$?.value;
    if (dateSelected) {
      const queryParams = this.route.snapshot.queryParams;
      const checkIn = queryParams[RouteKeyQueryParams.checkInDate];
      const checkOut = queryParams[RouteKeyQueryParams.checkOutDate];
      this.trackingService.track(MixpanelKeys.SelectDateRange, {
        name: 'Check in - Check out',
        checkin_origin: this.convertDate(checkIn),
        checkout_origin: this.convertDate(checkOut),
        checkin_change: this.convertDate(dateSelected?.from),
        checkout_change: this.convertDate(dateSelected?.to)
      });

      const tab = this.cartService.getActiveTab(queryParams);
      const cartState = this.cartService.getCartByIdx(tab);
      if (cartState) {
        this.cartService.setCartByIdx(tab, {
          ...cartState,
          arrival: parse(
            dateSelected?.from,
            'dd-MM-yyyy',
            new Date()
          ).toDateString(),
          departure: parse(
            dateSelected?.to,
            'dd-MM-yyyy',
            new Date()
          ).toDateString()
        });
      }
    }
  }

  convertDate(date: string): string {
    return date
      ? formatDate(
          date?.split('-')?.reverse()?.join('-'),
          'MMM dd, yyyy',
          'en-US'
        )
      : null;
  }

  clearSelectedDate(): void {
    this.datesSelected = [null, null];
    this.minDate = addDays(new Date(), -1);
    this.maxDate = null;
    this.bookingTransactionService.dateSelected$.next({
      from: null,
      to: null
    });
    this.store.dispatch(resetCalendarWithCheckin());
  }

  onRecalculateMaxCheckoutDate() {
    if (
      this.datesSelected?.[0] &&
      !this.datesSelected?.[1] &&
      (!this.maxDate ||
        DateUtils.isSameMonth(this.datesSelected?.[0], this.activeDate?.[0]) ||
        DateUtils.isSameMonth(this.datesSelected?.[0], this.activeDate?.[1]))
    ) {
      this.maxDate = this.getMaxCheckoutDate(this.datesSelected?.[0]);
    }
    this.isMonthChanged = false;
  }
}
