import AdyenCheckout from '@adyen/adyen-web';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '@app/apis/payment.service';
import { GoogleTrackingEvents } from '@app/constants/datalayer.enum';
import { AppRouterService } from '@app/services/app-router.service';
import { DuettoService } from '@app/services/duetto.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SojernService } from '@app/services/sojern.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { TrackingService } from '@app/services/tracking.service';
import { IseLoadingComponent } from '@app/shared/components/ise-loading/ise-loading.component';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  AvailablePaymentMethod,
  Booking,
  BookingTransactionStatusEnum,
  HotelPaymentModeCodeEnum,
  PaymentMethodDetails,
  PaymentProviderCodeEnum
} from '@core/graphql/generated/graphql';
import { environment } from '@environment/environment';
import { select, Store } from '@ngrx/store';
import {
  loadBookingStatus,
  loadBookingSummary
} from '@store/booking-summary/booking-summary.actions';
import {
  selectorBookingStatus,
  selectorBookingSummary
} from '@store/booking-summary/booking-summary.selectors';
import { loadAvailablePaymentMethodList } from '@store/suggestion/suggestion.actions';
import { selectorAvailablePaymentMethodList } from '@store/suggestion/suggestion.selectors';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { DateUtils } from '@utils/DateUtils';
import md5 from 'crypto-js/md5';
import * as moment from 'moment-timezone';
import {
  BehaviorSubject,
  from,
  interval,
  Observable,
  of,
  skipWhile,
  Subject,
  Subscription,
  timer
} from 'rxjs';
import {
  distinctUntilChanged,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-booking-processing',
  standalone: true,
  imports: [
    IseLoadingComponent,
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './booking-processing.component.html',
  styleUrl: './booking-processing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingProcessingComponent implements OnInit, OnDestroy {
  private appRouterService = inject(AppRouterService);
  store = inject(Store);
  route = inject(ActivatedRoute);
  sojernService = inject(SojernService);
  googleTrackingService = inject(GoogleTrackingService);
  trackingService = inject(TrackingService);
  duettoService = inject(DuettoService);
  hotelConfigService = inject(HotelConfigService);
  paymentService = inject(PaymentService);

  @ViewChild('frmPayment', { static: false }) frmPayment: ElementRef;

  bookingId: string;
  adyenCheckout;
  environment = environment.mode === 'production' ? 'live' : 'test';

  bookingInformationData$: BehaviorSubject<Booking> = new BehaviorSubject(null);
  stripeConnect: Stripe;
  availablePaymentMethodList$: Observable<AvailablePaymentMethod[]> =
    this.store.pipe(
      select(selectorAvailablePaymentMethodList),
      skipWhile((data) => !data),
      tap((data) => {
        // GUAWCC
        const paymentAccount = data?.find(
          (x) => x?.paymentMethodCode === HotelPaymentModeCodeEnum.Guawcc
        )?.paymentMethodDetailsList?.[0];
        if (paymentAccount) {
          switch (paymentAccount?.paymentProvider?.code) {
            case PaymentProviderCodeEnum.ApaleoPay:
              this.adyenCheckout = new AdyenCheckout({
                environment: this.environment,
                // @ts-ignore
                originKey:
                  paymentAccount?.metadata?.metadata?.bookingEngineOriginKey
              });
              break;
            case PaymentProviderCodeEnum.Adyen:
              this.adyenCheckout = new AdyenCheckout({
                environment: this.environment,
                // @ts-ignore
                clientKey: paymentAccount?.metadata?.metadata?.clientKey
              });
              break;
            case PaymentProviderCodeEnum.GauvendiPay:
              this.getStripeConnect(paymentAccount).subscribe((data) => {
                this.stripeConnect = data;
              });
              break;
            default:
              break;
          }
        }
      })
    );

  bookingInformation$: Observable<Booking> = this.store.pipe(
    select(selectorBookingSummary),
    skipWhile((data) => !data),
    tap((data) => {
      this.bookingInformationData$.next(data);
      const timezone = this.hotelConfigService.hotelTimezone?.value;
      this.store.dispatch(
        loadAvailablePaymentMethodList({
          variables: {
            filter: {
              propertyCode:
                this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode],
              salesPlanCodeList: [
                data?.reservationList[0]?.rfcRatePlan?.ratePlan?.code
              ],
              arrival: moment(data?.arrival).tz(timezone).format('yyyy-MM-DD'),
              departure: moment(data?.departure)
                .tz(timezone)
                .format('yyyy-MM-DD')
            }
          }
        })
      );
    })
  );

  bookingStatus$ = this.store.pipe(
    select(selectorBookingStatus),
    skipWhile((data) => !data),
    distinctUntilChanged(
      (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
    ),
    tap((data) => {
      if (
        data?.bookingTransaction?.status ===
        BookingTransactionStatusEnum.PaymentSucceeded
      ) {
        this.trackingAndNavigateToBookingSummary(
          this.bookingInformationData$?.getValue()
        );
      } else if (
        data?.bookingTransaction?.status ===
          BookingTransactionStatusEnum.PendingPayment &&
        data?.action
      ) {
        // cancel interval
        this.destroyed$.next(null);
        this.destroyed$.complete();
        // 3DS
        if (
          data?.action.paymentProviderCode === PaymentProviderCodeEnum.Adyen ||
          data?.action.paymentProviderCode === PaymentProviderCodeEnum.ApaleoPay
        ) {
          const queryParams = this.route.snapshot.queryParams;
          // store hotelCode, language and currency,...
          localStorage.setItem(
            'hotelCode',
            queryParams[RouteKeyQueryParams.hotelCode]
          );
          localStorage.setItem(
            'language',
            queryParams[RouteKeyQueryParams.lang]
          );
          localStorage.setItem(
            'currency',
            queryParams[RouteKeyQueryParams.currency]
          );
          localStorage.setItem(
            'paymentProvider',
            data?.action?.paymentProviderCode
          );
          localStorage.setItem(
            'recommendationId',
            queryParams[RouteKeyQueryParams.recommendationId]
          );
          localStorage.setItem(
            'requestId',
            queryParams[RouteKeyQueryParams.requestId]
          );

          this.adyenCheckout
            .createFromAction({
              url: data?.action?.url,
              method: data?.action?.method,
              type: data?.action?.type,
              data: {
                MD: data?.action?.data?.MD,
                PaReq: data?.action?.data?.paReq,
                TermUrl: data?.action?.data?.termUrl
              }
            })
            .mount(this.frmPayment.nativeElement);
        }

        if (
          data?.action.paymentProviderCode ===
          PaymentProviderCodeEnum.GauvendiPay
        ) {
          const clientSecret = data?.action?.paymentData;
          if (clientSecret) {
            this.stripeConnect
              .confirmCardPayment(clientSecret, {
                payment_method: data?.action?.paymentMethodId
              })
              .then((confirmRes) => {
                if (confirmRes?.error) {
                  // navigate booking error
                  this.navigateToBookingError();
                } else {
                  this.paymentService
                    .completeBookingPayment({
                      booking: {
                        id: this.bookingId,
                        hotelCode:
                          this.route.snapshot.queryParams[
                            RouteKeyQueryParams.hotelCode
                          ]
                      },
                      paymentIntent: {
                        clientSecret,
                        id: confirmRes?.paymentIntent?.id,
                        paymentProviderCode: data?.action
                          ?.paymentProviderCode as PaymentProviderCodeEnum
                      }
                    })
                    .subscribe(() => window.location.reload());
                }
              });
          }
        }

        if (
          data?.action?.paymentProviderCode === PaymentProviderCodeEnum.OnePay
        ) {
          window.location.href = data?.action?.paymentData;
        }
      } else if (
        data?.bookingTransaction?.status ===
        BookingTransactionStatusEnum.PaymentFailed
      ) {
        this.navigateToBookingError();
      }
    })
  );
  hotelCurrency = this.hotelConfigService.hotel$.value?.baseCurrency?.code;

  schedule$: Subscription;
  destroyed$ = new Subject();

  getStripeConnect(paymentAccount: PaymentMethodDetails): Observable<Stripe> {
    if (
      paymentAccount?.paymentProvider?.code ===
        PaymentProviderCodeEnum.GauvendiPay &&
      paymentAccount?.metadata?.metadata?.publicKey
    ) {
      const params = paymentAccount?.metadata?.metadata?.bookingEngineOriginKey
        ? {
            stripeAccount:
              paymentAccount?.metadata?.metadata?.bookingEngineOriginKey
          }
        : {};
      return from(
        loadStripe(paymentAccount?.metadata?.metadata?.publicKey, { ...params })
      );
    }
    return of(null);
  }

  ngOnInit(): void {
    this.bookingId =
      this.route.snapshot.queryParams[RouteKeyQueryParams.paymentId];
    this.schedule$ = timer(5000)
      .pipe(
        switchMap(() => interval(10000)),
        tap(() => {
          this.store.dispatch(
            loadBookingStatus({
              variables: {
                filter: {
                  bookingId: this.bookingId
                }
              }
            })
          );
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();

    this.store.dispatch(
      loadBookingSummary({
        variables: {
          filter: {
            id: this.route.snapshot.queryParams[RouteKeyQueryParams.paymentId]
          }
        }
      })
    );
  }

  trackingAndNavigateToBookingSummary(bookingInfo: Booking): void {
    const queryParams = this.route.snapshot.queryParams;

    // GA tracking
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    const currency = this.hotelCurrency?.toUpperCase() ?? '';
    const eCommerceItems = [];
    const eCommerceItem = {
      currency,
      id: bookingInfo?.bookingNumber,
      price: bookingInfo?.totalGrossAmount,
      start_date: moment(DateUtils.safeDate(bookingInfo?.arrival)).format(
        'DD.MM.yyyy'
      ),
      end_date: moment(DateUtils.safeDate(bookingInfo?.departure)).format(
        'DD.MM.yyyy'
      )
    };
    eCommerceItems.push(eCommerceItem);
    // const eCommerceTransaction = {
    //   affiliation: 'GauVendi',
    //   currency: this.hotelCurrency?.toUpperCase() ?? '',
    //   items: eCommerceItems,
    //   transaction_id: bookingInfo?.bookingNumber,
    //   value: bookingInfo?.totalGrossAmount
    // };
    // this.googleTrackingService.trackPurchaseEvent(
    //   hotelCode,
    //   bookingInfo,
    //   this.hotelCurrency?.toUpperCase() ?? '',
    //   eCommerceTransaction
    // );

    const coupon = queryParams[RouteKeyQueryParams.promoCode] ?? '';

    const timezone = this.hotelConfigService.hotelTimezone.value;

    // navigate booking summary
    this.appRouterService.updateRouteQueryParams(
      {
        [RouteKeyQueryParams.currency]:
          queryParams[RouteKeyQueryParams.currency],
        [RouteKeyQueryParams.hotelCode]:
          queryParams[RouteKeyQueryParams.hotelCode],
        [RouteKeyQueryParams.lang]: queryParams[RouteKeyQueryParams.lang],
        [RouteKeyQueryParams.paymentId]: bookingInfo?.id,
        [RouteKeyQueryParams.requestId]:
          queryParams[RouteKeyQueryParams.requestId],
        [RouteKeyQueryParams.recommendationId]:
          queryParams[RouteKeyQueryParams.recommendationId]
      },
      {
        navigateUrl: RouterPageKey.paymentResult,
        replaceUrl: true,
        done: () => {
          this.googleTrackingService.pushGoogleTrackingEvent(
            hotelCode,
            GoogleTrackingEvents.purchase,
            {
              transaction_id: bookingInfo?.bookingNumber,
              currency,
              value: Number(bookingInfo?.totalGrossAmount?.toFixed(2)),
              coupon,
              items:
                bookingInfo?.reservationList?.map((res, index) => {
                  const bookingDuration = moment
                    .tz(res?.departure, timezone)
                    .startOf('days')
                    .diff(
                      moment.tz(res?.arrival, timezone).startOf('days'),
                      'days'
                    );
                  return {
                    index,
                    item_id: res?.rfc?.code,
                    item_name: res?.rfc?.name,
                    item_brand: this.hotelConfigService.hotel$.value?.name,
                    item_category: 'Room',
                    item_category2: 'Hotel',
                    item_variant: res?.rfcRatePlan?.ratePlan?.name,
                    quantity: bookingDuration,
                    price: Number(
                      (res?.totalGrossAmount / bookingDuration)?.toFixed(2)
                    ),
                    currency,
                    coupon: coupon ?? '',
                    discount: null
                  };
                }) ?? []
            }
          );

          // Mixpanel tracking
          this.trackingService.track(MixpanelKeys.CompleteBooking, {
            arrival: moment(DateUtils.safeDate(bookingInfo?.arrival)).format(
              'MMM DD, yyyy'
            ),
            departure: moment(
              DateUtils.safeDate(bookingInfo?.departure)
            ).format('MMM DD, yyyy'),
            booking_id: bookingInfo?.id,
            booking_number: bookingInfo?.bookingNumber,
            total_base_amount: bookingInfo?.totalBaseAmount,
            total_gross_amount: bookingInfo?.totalGrossAmount,
            city_tax_amount: bookingInfo?.cityTaxAmount,
            vat_amount: bookingInfo?.vatAmount,
            tax_amount: bookingInfo?.taxAmount,
            balance: bookingInfo?.balance,
            total_adult: bookingInfo?.totalAdult,
            total_children: bookingInfo?.totalChildren,
            reservation_list: bookingInfo?.reservationList?.map((x) => {
              return {
                reservation_number: x?.reservationNumber,
                rfc_code: x?.rfc?.code,
                adult: x?.adult,
                children: x?.childrenAgeList?.length,
                total_base_amount: x?.totalBaseAmount,
                total_gross_amount: x?.totalGrossAmount,
                matched_feature_list: x?.matchedFeatureList
                  ?.map((y) => y?.code)
                  ?.join(',')
              };
            }),
            booking_flow: bookingInfo?.bookingFlow,
            request_id: queryParams[RouteKeyQueryParams.requestId]
              ? queryParams[RouteKeyQueryParams.requestId]
              : uuidv4(),
            recommendation_id: queryParams[RouteKeyQueryParams.recommendationId]
              ? queryParams[RouteKeyQueryParams.recommendationId]
              : uuidv4()
          });

          // Sojern tracking
          this.sojernService.trackingConversion({
            hd1: moment(DateUtils.safeDate(bookingInfo?.arrival)).format(
              'yyyy-MM-DD'
            ),
            hd2: moment(DateUtils.safeDate(bookingInfo?.departure)).format(
              'yyyy-MM-DD'
            ),
            t: bookingInfo?.reservationList?.reduce((acc, cur) => {
              return acc + +cur?.adult + (cur?.childrenAgeList?.length || 0);
            }, 0),
            hr: bookingInfo?.reservationList?.length,
            hp: bookingInfo?.totalBaseAmount,
            hconfno: bookingInfo?.bookingNumber,
            md5_eml: md5(bookingInfo?.booker?.emailAddress?.toLowerCase())
          });

          // Duetto tracking
          this.duettoService.trackMakeBooking({
            b: bookingInfo?.bookingNumber,
            rt: bookingInfo?.reservationList
              ?.map((x) => x?.rfc?.code)
              ?.join('+'),
            rc: bookingInfo?.reservationList
              ?.map((x) => x?.rfcRatePlan?.ratePlan?.code)
              ?.join('+'),
            r: bookingInfo?.totalBaseAmount,
            na: bookingInfo?.reservationList?.reduce((a, b) => a + b?.adult, 0),
            nc: bookingInfo?.reservationList?.reduce(
              (a, b) => a + b?.childrenAgeList?.length,
              0
            )
          });
        }
      }
    );
  }

  navigateToBookingError(): void {
    const queryParams = this.route.snapshot.queryParams;
    this.appRouterService.updateRouteQueryParams(
      {
        [RouteKeyQueryParams.currency]:
          queryParams[RouteKeyQueryParams.currency],
        [RouteKeyQueryParams.hotelCode]:
          queryParams[RouteKeyQueryParams.hotelCode],
        [RouteKeyQueryParams.lang]: queryParams[RouteKeyQueryParams.lang]
      },
      {
        navigateUrl: `${RouterPageKey.bookingProcessing}/error`
      }
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }
}
