import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { OnepayPaymentComponent } from '@app/modules/site/pages/summary-payment/components/onepay-payment/onepay-payment.component';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SojernService } from '@app/services/sojern.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { BookingInformationLoadingComponent } from '@app/shared/components/booking-information-loading/booking-information-loading.component';
import { BookingInformationPanelLoadingComponent } from '@app/shared/components/booking-information-panel-loading/booking-information-panel-loading.component';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ParseAdditionalGuestPipe } from '@app/shared/pipes/parse-additional-guest.pipe';
import { ParseCompanyInformationInputPipe } from '@app/shared/pipes/parse-company-information-input.pipe';
import { ParseGuestInformationInputListPipe } from '@app/shared/pipes/parse-guest-information-input-list.pipe';
import { ParseGuestInformationInputPipe } from '@app/shared/pipes/parse-guest-information-input.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  selectorCurrencyCodeSelected,
  selectorSummaryBarBooking
} from '@app/state-management/router.selectors';
import { loadSurchargeAmenityList } from '@app/store/pick-extras/pick-extras.actions';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  AvailablePaymentMethod,
  BookingPricing,
  HotelPaymentModeCodeEnum,
  PaymentMethodDetails,
  PaymentProviderCodeEnum,
  RequestBookingPaymentInput
} from '@core/graphql/generated/graphql';
import { environment } from '@environment/environment';
import { select, Store } from '@ngrx/store';
import {
  selectorCountry,
  selectorHotelMandatoryAddressMainGuest,
  selectorHotelName,
  selectorHotelPrivacy,
  selectorHotelRate,
  selectorHotelTaxInformation,
  selectorHotelTerms,
  selectorIsInclusive,
  selectorLocation,
  selectorLowestPriceImageUrl,
  selectorLowestPriceOpaque
} from '@store/hotel/hotel.selectors';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { loadCalculateBookingPricing } from '@store/pick-extras/pick-extras.actions';
import {
  selectorCalculateBookingPricing,
  summaryBookingAllRoom
} from '@store/pick-extras/pick-extras.selectors';
import {
  loadAvailableAmenity,
  loadAvailablePaymentMethodList
} from '@store/suggestion/suggestion.actions';
import {
  selectorAvailablePaymentMethodList,
  selectorHotelAvailableAmenities,
  selectorRatePlanList
} from '@store/suggestion/suggestion.selectors';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { isDate, parse } from 'date-fns';
import { combineLatest, concatMap, from, Observable, of, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  skipWhile,
  takeUntil,
  tap
} from 'rxjs/operators';
import { AdyenPaymentComponent } from './components/adyen-payment/adyen-payment.component';
import { BookingInformationComponent } from './components/booking-information/booking-information.component';
import { GvdPaymentComponent } from './components/gvd-payment/gvd-payment.component';
import { MewsPaymentComponent } from './components/mews-payment/mews-payment.component';
import { NoOpiPaymentComponent } from './components/no-opi-payment/no-opi-payment.component';
import { StripePaymentComponent } from './components/stripe-payment/stripe-payment.component';
import { SummaryPanelComponent } from './components/summary-panel/summary-panel.component';
import { TripPurposeComponent } from './components/trip-purpose/trip-purpose.component';
import { PaymentAndCancellationTemplateComponent } from '../../components/payment-and-cancellation-template/payment-and-cancellation-template.component';

@Component({
  selector: 'app-summary-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    BookingInformationComponent,
    SummaryPanelComponent,
    AdyenPaymentComponent,
    StripePaymentComponent,
    MewsPaymentComponent,
    ParseGuestInformationInputListPipe,
    ParseGuestInformationInputPipe,
    ParseAdditionalGuestPipe,
    BookingInformationLoadingComponent,
    BookingInformationPanelLoadingComponent,
    TranslatePipe,
    GvdPaymentComponent,
    TripPurposeComponent,
    ParseCompanyInformationInputPipe,
    OnepayPaymentComponent,
    NoOpiPaymentComponent,
    BreadcrumbComponent,
    PaymentAndCancellationTemplateComponent
  ],
  templateUrl: './summary-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryPaymentComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private bookingTransactionService = inject(BookingTransactionService);
  private sojernService = inject(SojernService);
  private hotelConfigService = inject(HotelConfigService);
  private suggestionHandlerService = inject(SuggestionHandlerService);
  private appRouterService = inject(AppRouterService);

  @ViewChild(BookingInformationComponent, { static: false })
  vcGuestInformation: BookingInformationComponent;
  @ViewChild(TripPurposeComponent, { static: false })
  vcTripPurpose: TripPurposeComponent;

  paymentProviderCodeEnum = PaymentProviderCodeEnum;
  needValidation: boolean;
  roomsConfigurationCode =
    this.route.snapshot.queryParams[
      RouteKeyQueryParams.roomStayOptionsCode
    ]?.split('~');
  environment = environment.mode === 'production' ? 'live' : 'test';
  requestBooking: RequestBookingPaymentInput = null;
  bookingDuration = this.bookingTransactionService.getNumberOfNight([
    parse(
      this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate],
      'dd-MM-yyyy',
      new Date()
    ),
    parse(
      this.route.snapshot.queryParams[RouteKeyQueryParams.checkOutDate],
      'dd-MM-yyyy',
      new Date()
    )
  ]);

  location$ = this.store.pipe(select(selectorLocation));
  stripeConnect$: Observable<Stripe> = this.store.pipe(
    select(selectorAvailablePaymentMethodList),
    skipWhile((data) => !data),
    filter((res) => res?.length > 0),
    map(
      (res) =>
        res?.find(
          (x) => x?.paymentMethodCode === HotelPaymentModeCodeEnum.Guawcc
        )?.paymentMethodDetailsList?.[0] || {}
    ),
    concatMap((paymentAccount) => {
      if (
        paymentAccount?.paymentProvider?.code ===
          PaymentProviderCodeEnum.GauvendiPay &&
        paymentAccount?.metadata?.metadata?.publicKey
      ) {
        const params = paymentAccount?.metadata?.metadata
          ?.bookingEngineOriginKey
          ? {
              stripeAccount:
                paymentAccount?.metadata?.metadata?.bookingEngineOriginKey
            }
          : {};
        return from(
          loadStripe(paymentAccount?.metadata?.metadata?.publicKey, {
            ...params
          })
        );
      }
      return of(null);
    })
  );

  locale$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang] || MultiLangEnum.EN)
  );
  bookingSrc$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.bookingSrc] || null)
  );
  isHotelInclusive$ = this.store.pipe(select(selectorIsInclusive));
  currencyCode$ = this.store.pipe(select(selectorCurrencyCodeSelected));
  currencyRate$ = this.store.pipe(select(selectorHotelRate));
  roomSummary$ = this.store.pipe(
    select(selectorSummaryBarBooking),
    map((x) => ({
      adults: +x?.adult,
      children: +x?.children,
      pets: +x?.pets
    }))
  );
  mandatoryAddressMainGuest$ = this.store.pipe(
    select(selectorHotelMandatoryAddressMainGuest)
  );
  paymentMethodDetails$: Observable<PaymentMethodDetails> = this.store.pipe(
    select(selectorAvailablePaymentMethodList),
    skipWhile((data) => !data),
    filter((res) => res?.length > 0),
    map(
      (res) =>
        res?.find(
          (x) => x?.paymentMethodCode === HotelPaymentModeCodeEnum.Guawcc
        )?.paymentMethodDetailsList?.[0] || {}
    )
  );
  hotelName$: Observable<string> = this.store.pipe(select(selectorHotelName));
  isLowestPriceOpaque$ = this.store.pipe(select(selectorLowestPriceOpaque));
  lowestPriceImageUrl$ = this.store.select(selectorLowestPriceImageUrl);
  isCustomized$ = this.route.queryParams.pipe(
    map((params) => +params[RouteKeyQueryParams.customize] === 1)
  );
  hotelTaxInformationSetting$: Observable<{
    [key: string]: string;
  }> = this.store.pipe(select(selectorHotelTaxInformation));
  availablePaymentMethodList$: Observable<AvailablePaymentMethod[]> =
    this.store.pipe(
      select(selectorAvailablePaymentMethodList),
      map((res) => (res?.length > 0 ? res : []))
    );
  hotelCountry$ = this.store.pipe(select(selectorCountry));

  cancellationPolicy$ = combineLatest([
    this.store.select(selectorRatePlanList),
    this.route?.queryParams
  ]).pipe(
    map(
      ([ratePlanList, queryParams]) =>
        ratePlanList?.find(
          (ratePlan) =>
            ratePlan?.code === queryParams[RouteKeyQueryParams.ratePlanCode]
        )?.strongestCxlPolicy?.description
    )
  );

  availableAmenity$ = this.store.pipe(
    select(selectorHotelAvailableAmenities),
    skipWhile((data) => !data),
    tap((data) => {
      this.breadcrumb =
        data?.length > 0
          ? [
              {
                name: 'ENHANCE_YOUR_STAY',
                isSelected: false,
                url: RouterPageKey.pickExtras
              },
              {
                name: 'BOOKING_SUMMARY',
                isSelected: true,
                url: null
              }
            ]
          : [
              {
                name: 'BOOKING_SUMMARY',
                isSelected: true,
                url: null
              }
            ];
    })
  );
  hotelTerms$: Observable<string> = this.store.pipe(select(selectorHotelTerms));
  hotelPrivacy$: Observable<string> = this.store.pipe(
    select(selectorHotelPrivacy)
  );
  colorText$ = this.hotelConfigService.colorText$;
  colorSecondaryText$ = this.hotelConfigService.colorSecondaryText$;
  colorPrimary$ = this.hotelConfigService.hotelPrimaryColor$;
  summaryBooking$: Observable<BookingPricing> = this.store.pipe(
    select(selectorCalculateBookingPricing),
    map((res) => (res?.totalGrossAmount ? res : {})),
    tap((bookingInformation: BookingPricing) => {
      this.sojernService.trackingShoppingCart({
        hcu: String(
          this.route.snapshot.queryParams[RouteKeyQueryParams.currency]
        )?.toUpperCase(),
        hp: bookingInformation?.totalGrossAmount
      });
    }),
    shareReplay()
  );
  bookingInformation$ = combineLatest([
    this.store.pipe(select(summaryBookingAllRoom)),
    this.summaryBooking$
  ]).pipe(
    map(([res, summaryBooking]) => {
      if (!summaryBooking) {
        return res;
      }

      const categoryCodeList =
        summaryBooking?.reservationPricingList?.map((x) => {
          const categoryMap = new Map<
            string,
            { codeList: string[]; sequence: number }
          >();

          x?.roomProduct?.retailFeatureList?.forEach((feature) => {
            const { code: categoryCode, displaySequence: sequence } =
              feature.hotelRetailCategory;

            if (!categoryMap.has(categoryCode)) {
              categoryMap.set(categoryCode, {
                codeList: [feature.code],
                sequence
              });
            } else {
              categoryMap.get(categoryCode).codeList.push(feature.code);
            }
          });

          const categoryList = Array.from(categoryMap.values()).sort(
            (a, b) => a.sequence - b.sequence
          );

          return categoryList;
        }) || [];

      const newReservationList = res?.reservationList?.map(
        (reservation, index) => {
          if (reservation?.priorityCategoryCodeList?.length) {
            return reservation;
          }

          const priorityCategoryCodeList = categoryCodeList[index] || [];
          return {
            ...reservation,
            priorityCategoryCodeList
          };
        }
      );

      return {
        ...res,
        reservationList: newReservationList
      };
    })
  );
  destroyed$ = new Subject();
  childrenFiltered$ = this.route.queryParams.pipe(
    distinctUntilChanged(),
    map((data) => this.bookingTransactionService.getRoomRequestList(data))
  );

  breadcrumb = [];

  constructor() {}

  ngOnDestroy(): void {
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    const hotelCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode];
    const ratePlanCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.ratePlanCode];
    this.loadPaymentOptions(hotelCode, ratePlanCode);
    this.route.queryParams
      .pipe(
        map((params) => params[RouteKeyQueryParams.lang]),
        distinctUntilChanged()
      )
      .subscribe((locale) => {
        this.loadCalculatePaymentReservation();
        this.loadAvailableAmenity();
        // loadRatePlanList
        this.suggestionHandlerService.loadRatePlanList();
      });

    // Scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    const queryParams = this.route.snapshot.queryParams;
    const isCustomize = +queryParams[RouteKeyQueryParams.customize] === 1;
    const priorityCategoryCodeList =
      this.bookingTransactionService.getPriorityCategoryCodeList(queryParams);

    this.requestBooking = Object.assign({
      priorityCategoryCodeList: isCustomize ? priorityCategoryCodeList : []
    });

    this.availableAmenity$.pipe(takeUntil(this.destroyed$)).subscribe();
    this.loadSurchargeAmenityList();
  }

  loadSurchargeAmenityList(): void {
    this.store.dispatch(
      loadSurchargeAmenityList({
        variables: {
          filter: {
            hotelCode:
              this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode]
          }
        }
      })
    );
  }

  loadCalculatePaymentReservation(): void {
    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    const arrival = this.bookingTransactionService.getArrival(queryParams);
    const departure = this.bookingTransactionService.getDeparture(queryParams);

    const roomRequestList =
      this.bookingTransactionService.getRoomRequestList(queryParams);
    const locale = queryParams[RouteKeyQueryParams.lang];
    const arrivalDateTime =
      this.bookingTransactionService.convertDateToISOFormat(new Date(arrival));
    const departureDateTime =
      this.bookingTransactionService.convertDateToISOFormat(
        new Date(departure)
      );

    this.store.dispatch(
      loadCalculateBookingPricing({
        variables: {
          input: {
            propertyCode: hotelCode,
            translateTo:
              locale === MultiLangEnum.EN ? null : locale?.toLocaleUpperCase(),
            reservationList: roomRequestList?.map((x, index) => {
              return {
                adults: x?.adult,
                arrival: arrivalDateTime,
                departure: departureDateTime,
                childrenAgeList: x?.childrenAgeList,
                pets: x?.pets,
                amenityList: this.bookingTransactionService
                  .getAmenityServices(queryParams, index)
                  ?.filter((i) => !!i.code),
                roomProductCode:
                  queryParams[RouteKeyQueryParams.rfcCodes]?.split('~')[index],
                salesPlanCode: queryParams[RouteKeyQueryParams.ratePlanCode]
              };
            })
          }
        }
      })
    );
  }

  loadAvailableAmenity(): void {
    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = this.bookingTransactionService.getHotelCode(queryParams);
    const fromTime = this.bookingTransactionService
      .getArrival(queryParams)
      .toString();
    const toTime = this.bookingTransactionService
      .getDeparture(queryParams)
      .toString();
    const locale = queryParams[RouteKeyQueryParams.lang];
    const translateTo =
      locale === MultiLangEnum.EN ? null : locale?.toLocaleUpperCase();
    const salesPlanCode = queryParams[RouteKeyQueryParams.ratePlanCode];

    this.store.dispatch(
      loadAvailableAmenity({
        variables: {
          filter: {
            hotelCode,
            fromTime,
            toTime,
            translateTo,
            salesPlanCode,
            roomRequestList:
              this.bookingTransactionService.getRoomRequestList(queryParams)
          }
        }
      })
    );
  }

  loadPaymentOptions(propertyCode: string, salesPlanCode: string): void {
    const queryParams = this.route.snapshot.queryParams;
    let arrival = queryParams[RouteKeyQueryParams.checkInDate];
    let departure = queryParams[RouteKeyQueryParams.checkOutDate];
    const pattern = 'dd-MM-yyyy';
    if (!!arrival && isDate(parse(arrival, pattern, new Date()))) {
      arrival = arrival?.split('-')?.reverse()?.join('-');
    }
    if (!!departure && isDate(parse(departure, pattern, new Date()))) {
      departure = departure?.split('-')?.reverse()?.join('-');
    }
    // this.store.dispatch(
    //   loadPaymentOptionsBySalesPlan({
    //     variables: {
    //       filter: {
    //         propertyCode,
    //         salesPlanCodeList: [salesPlanCode],
    //         arrival,
    //         departure,
    //       },
    //     },
    //   }),
    // );
    this.store.dispatch(
      loadAvailablePaymentMethodList({
        variables: {
          filter: {
            propertyCode,
            salesPlanCodeList: [salesPlanCode],
            arrival,
            departure
          }
        }
      })
    );
  }

  onBack(): void {
    this.appRouterService.updateRouteQueryParams(
      this.route.snapshot.queryParams,
      {
        navigateUrl: RouterPageKey.pickExtras
      }
    );
  }
}
