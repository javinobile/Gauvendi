import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { HotelService } from '@app/apis/hotel.service';
import { PaymentService } from '@app/apis/payment.service';
import { BookerReviewComponent } from '@app/modules/site/pages/booking-review/components/booker-review/booker-review.component';
import { CompanyReviewComponent } from '@app/modules/site/pages/booking-review/components/company-review/company-review.component';
import { GuestReviewComponent } from '@app/modules/site/pages/booking-review/components/guest-review/guest-review.component';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { CheckInfoCompanyPipe } from '@app/modules/site/pipes/check-info-company.pipe';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { BookingInformationLoadingComponent } from '@app/shared/components/booking-information-loading/booking-information-loading.component';
import { BookingInformationPanelLoadingComponent } from '@app/shared/components/booking-information-panel-loading/booking-information-panel-loading.component';
import { BookingSummaryPanelComponent } from '@app/shared/components/booking-summary-panel/booking-summary-panel.component';
import { PaymentConfirmationTotalComponent } from '@app/shared/components/payment-confirmation-total/payment-confirmation-total.component';
import { CheckboxCComponent } from '@app/shared/form-controls/checkbox-c/checkbox-c.component';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { ParseMetadataConfigPipe } from '@app/shared/pipes/parse-metadata-config.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  Booking,
  Country,
  ReservationStatusEnum
} from '@core/graphql/generated/graphql';
import { select, Store } from '@ngrx/store';
import { loadCppBookingSummary } from '@store/booking-summary/booking-summary.actions';
import { selectorCppBookingSummary } from '@store/booking-summary/booking-summary.selectors';
import {
  selectorCountry,
  selectorHotelName,
  selectorHotelPrivacy,
  selectorHotelRate,
  selectorHotelTaxInformation,
  selectorHotelTerms,
  selectorIsInclusive,
  selectorLowestPriceImageUrl,
  selectorLowestPriceOpaque
} from '@store/hotel/hotel.selectors';
import { loadStaticContent } from '@store/multi-lang/multi-lang.actions';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { BehaviorSubject, finalize, map, Observable, skipWhile } from 'rxjs';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';

@Component({
  selector: 'app-booking-review',
  standalone: true,
  imports: [
    BookerReviewComponent,
    BookingInformationLoadingComponent,
    BookingInformationPanelLoadingComponent,
    BookingSummaryPanelComponent,
    CheckboxCComponent,
    CheckInfoCompanyPipe,
    CommonModule,
    CompanyReviewComponent,
    CurrencyRatePipe,
    GuestReviewComponent,
    MatDialogModule,
    MyCurrencyPipe,
    ParseMetadataConfigPipe,
    PaymentConfirmationTotalComponent,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './booking-review.component.html',
  styleUrls: ['./booking-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingReviewComponent implements OnInit {
  termCtrl: FormControl = this.fb.control(false);

  bookingInformation$: Observable<Booking> = this.store.pipe(
    select(selectorCppBookingSummary),
    skipWhile((data) => !data),
    filter((data) => data?.id?.length > 0),
    map((data) => ({
      ...data,
      reservationList: data?.reservationList?.filter(
        (res) => res?.status !== ReservationStatusEnum.Cancelled
      )
    })),
    tap((data) => {
      if (data) {
        const bookingStatus =
          data?.reservationList?.[0]?.status ?? ReservationStatusEnum.Cancelled;

        // check acceptTnc = false -> can access page
        if (!data?.acceptTnc) {
          return;
        }

        if (data?.acceptTnc) {
          this.router
            .navigate([RouterPageKey.paymentResult], {
              queryParams: {
                [RouteKeyQueryParams.hotelCode]:
                  this.route.snapshot.queryParams[
                    RouteKeyQueryParams.hotelCode
                  ],
                [RouteKeyQueryParams.lang]:
                  this.route.snapshot.queryParams[RouteKeyQueryParams.lang],
                [RouteKeyQueryParams.paymentId]:
                  this.route.snapshot.queryParams[RouteKeyQueryParams.paymentId]
              },
              queryParamsHandling: 'preserve'
            })
            .then();
          return;
        }

        // for cancel booking proposal
        if (bookingStatus !== ReservationStatusEnum.Reserved) {
          this.router
            .navigate([RouterPageKey.bookingProposal, 'expiration'], {
              queryParams: {
                [RouteKeyQueryParams.hotelCode]:
                  this.route.snapshot.queryParams[
                    RouteKeyQueryParams.hotelCode
                  ],
                [RouteKeyQueryParams.lang]:
                  this.route.snapshot.queryParams[RouteKeyQueryParams.lang]
              },
              queryParamsHandling: 'preserve'
            })
            .then();
          return;
        }
      }
    })
  );
  countries$: Observable<Country[]> = this.hotelService.countryList();
  isLockSubmitPayment$ = new BehaviorSubject(false);
  hotelName$: Observable<string> = this.store.pipe(select(selectorHotelName));
  locale$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang] || MultiLangEnum.EN)
  );
  currencyCode$ = this.store.pipe(select(selectorCurrencyCodeSelected));
  currencyRate$ = this.store.pipe(select(selectorHotelRate));
  isLowestPriceOpaque$ = this.store.pipe(select(selectorLowestPriceOpaque));
  lowestPriceImageUrl$ = this.store.select(selectorLowestPriceImageUrl);
  isHotelInclusive$ = this.store.pipe(select(selectorIsInclusive));
  hotelCountry$ = this.store.pipe(select(selectorCountry));
  hotelTerms$: Observable<string> = this.store.pipe(select(selectorHotelTerms));
  hotelPrivacy$: Observable<string> = this.store.pipe(
    select(selectorHotelPrivacy)
  );
  hotelTaxInformationSetting$: Observable<{
    [key: string]: string;
  }> = this.store.pipe(select(selectorHotelTaxInformation));
  timezone$ = this.hotelConfigService.hotelTimezone;

  paymentErrorMessage$ = new BehaviorSubject<string>(
    'We are unable to process. Please try again.'
  );
  hasErrorPayment$ = new BehaviorSubject(false);
  colorText$ = this.hotelConfigService.colorText$;
  colorPrimary$ = this.hotelConfigService.hotelPrimaryColor$;
  colorSecondaryText$ = this.hotelConfigService.colorSecondaryText$;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private hotelService: HotelService,
    private fb: FormBuilder,
    private hotelConfigService: HotelConfigService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id: string =
      this.route.snapshot.queryParams[RouteKeyQueryParams.paymentId];

    this.route.queryParams
      .pipe(
        map(
          (queryParams) =>
            queryParams[RouteKeyQueryParams.lang] || MultiLangEnum.EN
        ),
        distinctUntilChanged()
      )
      .subscribe((lang) => {
        this.store.dispatch(
          loadStaticContent({
            locale: lang
          })
        );

        this.store.dispatch(
          loadCppBookingSummary({
            variables: {
              filter: {
                bookingId: id,

                translateTo:
                  lang === MultiLangEnum.EN ? null : lang?.toLocaleUpperCase()
              }
            }
          })
        );
      });
  }

  submitConfirmPayment(): void {
    const id: string =
      this.route.snapshot.queryParams[RouteKeyQueryParams.paymentId];
    const queryParams = this.route.snapshot.queryParams;
    this.isLockSubmitPayment$.next(true);
    this.paymentService
      .updateBookingInformation({
        input: {
          id,
          acceptTnc: true
        }
      })
      .pipe(finalize(() => this.isLockSubmitPayment$.next(false)))
      .subscribe({
        next: (res) => {
          if (res?.status === 'SUCCESS') {
            this.hasErrorPayment$.next(false);
            this.router
              .navigate([RouterPageKey.paymentResult], {
                queryParams: {
                  [RouteKeyQueryParams.currency]:
                    queryParams[RouteKeyQueryParams.currency],
                  [RouteKeyQueryParams.hotelCode]:
                    queryParams[RouteKeyQueryParams.hotelCode],
                  [RouteKeyQueryParams.lang]:
                    queryParams[RouteKeyQueryParams.lang],
                  [RouteKeyQueryParams.paymentId]: id
                }
              })
              .then();
          } else {
            this.hasErrorPayment$.next(true);
          }
        },
        error: () => this.hasErrorPayment$.next(true)
      });
  }
}
