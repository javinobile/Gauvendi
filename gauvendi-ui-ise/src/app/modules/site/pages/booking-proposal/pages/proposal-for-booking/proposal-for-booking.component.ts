import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingNotesComponent } from '@app/modules/site/pages/booking-proposal/components/booking-notes/booking-notes.component';
import { ProposalAdyenComponent } from '@app/modules/site/pages/booking-proposal/components/proposal-adyen/proposal-adyen.component';
import { ProposalGvdComponent } from '@app/modules/site/pages/booking-proposal/components/proposal-gvd/proposal-gvd.component';
import { ProposalMewsComponent } from '@app/modules/site/pages/booking-proposal/components/proposal-mews/proposal-mews.component';
import { ProposalOnepayComponent } from '@app/modules/site/pages/booking-proposal/components/proposal-onepay/proposal-onepay.component';
import { ProposalStripeComponent } from '@app/modules/site/pages/booking-proposal/components/proposal-stripe/proposal-stripe.component';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { BookingInformationLoadingComponent } from '@app/shared/components/booking-information-loading/booking-information-loading.component';
import { BookingInformationPanelLoadingComponent } from '@app/shared/components/booking-information-panel-loading/booking-information-panel-loading.component';
import { BookingSummaryPanelComponent } from '@app/shared/components/booking-summary-panel/booking-summary-panel.component';
import { PaymentConfirmationTotalComponent } from '@app/shared/components/payment-confirmation-total/payment-confirmation-total.component';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { ParseAdditionalGuestProposalPipe } from '@app/shared/pipes/parse-additional-guest-proposal.pipe';
import { ParseCompanyInformationInputPipe } from '@app/shared/pipes/parse-company-information-input.pipe';
import { ParseGuestInformationInputPipe } from '@app/shared/pipes/parse-guest-information-input.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  Booking,
  HotelPaymentModeCodeEnum,
  PaymentMethodDetails,
  PaymentProviderCodeEnum,
  ReservationStatusEnum
} from '@core/graphql/generated/graphql';
import { environment } from '@environment/environment';
import { select, Store } from '@ngrx/store';
import { loadCppBookingSummary } from '@store/booking-summary/booking-summary.actions';
import { selectorCppBookingSummary } from '@store/booking-summary/booking-summary.selectors';
import {
  selectorCountry,
  selectorHotelCityTax,
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
import { loadStaticContent } from '@store/multi-lang/multi-lang.actions';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { loadAvailablePaymentMethodList } from '@store/suggestion/suggestion.actions';
import { selectorAvailablePaymentMethodList } from '@store/suggestion/suggestion.selectors';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import * as moment from 'moment-timezone';
import { concatMap, from, Observable, of, tap } from 'rxjs';
import { distinctUntilChanged, filter, map, skipWhile } from 'rxjs/operators';

import { BookerInformationComponent } from '../../components/booker-information/booker-information.component';
import { CompanyInformationComponent } from '../../components/company-information/company-information.component';
import { GuestInformationComponent } from '../../components/guest-information/guest-information.component';
import { ProposalNoOpiComponent } from '../../components/proposal-no-opi/proposal-no-opi.component';

@Component({
  selector: 'app-proposal-for-booking',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyRatePipe,
    MyCurrencyPipe,
    ParseGuestInformationInputPipe,
    PaymentConfirmationTotalComponent,
    ProposalAdyenComponent,
    ProposalGvdComponent,
    ProposalMewsComponent,
    ProposalStripeComponent,
    TranslatePipe,
    BookerInformationComponent,
    GuestInformationComponent,
    CompanyInformationComponent,
    BookingInformationLoadingComponent,
    BookingInformationPanelLoadingComponent,
    BookingSummaryPanelComponent,
    ParseCompanyInformationInputPipe,
    BookingNotesComponent,
    ProposalOnepayComponent,
    ParseAdditionalGuestProposalPipe,
    ProposalNoOpiComponent
  ],
  templateUrl: './proposal-for-booking.component.html',
  styleUrls: ['./proposal-for-booking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProposalForBookingComponent implements OnInit {
  @ViewChild(GuestInformationComponent, { static: false })
  vcGuestInformation: GuestInformationComponent;
  @ViewChild(BookerInformationComponent, { static: false })
  vcBookerInformation: BookerInformationComponent;
  @ViewChild(CompanyInformationComponent, { static: false })
  vcCompanyInformation: CompanyInformationComponent;
  @ViewChild(BookingNotesComponent, { static: false })
  vcBookingNotes: BookingNotesComponent;
  route = inject(ActivatedRoute);
  router = inject(Router);
  store = inject(Store);
  suggestionHandlerService = inject(SuggestionHandlerService);
  hotelConfigService = inject(HotelConfigService);
  paymentProviderCodeEnum = PaymentProviderCodeEnum;
  environment = environment.mode === 'production' ? 'live' : 'test';
  needValidation: boolean;
  specialRequestData: { reservationNumber: string; specialRequest: string }[] =
    null;

  location$ = this.store.pipe(select(selectorLocation));
  mandatoryAddressMainGuest$ = this.store.pipe(
    select(selectorHotelMandatoryAddressMainGuest)
  );
  bookingInformation$: Observable<Booking> = this.store.pipe(
    select(selectorCppBookingSummary),
    skipWhile((data) => !data),
    filter((data) => !!data),
    tap((data) => {
      const timezone = this.hotelConfigService.hotelTimezone?.value;
      const arrival = moment(data?.arrival).tz(timezone).format('yyy-MM-DD');
      const departure = moment(data?.departure)
        .tz(timezone)
        .format('yyy-MM-DD');

      this.store.dispatch(
        loadAvailablePaymentMethodList({
          variables: {
            filter: {
              propertyCode:
                this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode],
              arrival,
              departure,
              salesPlanCodeList: data?.reservationList?.map(
                (x) => x?.rfcRatePlan?.ratePlan?.code
              )
            }
          }
        })
      );

      const bookingStatus = data?.reservationList?.[0]?.status;
      // for decline booking proposal
      if (
        bookingStatus !== ReservationStatusEnum.Proposed &&
        bookingStatus === ReservationStatusEnum.Cancelled
      ) {
        this.router
          .navigate([RouterPageKey.bookingProposal, 'declined'], {
            queryParams: {
              [RouteKeyQueryParams.hotelCode]:
                this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode],
              [RouteKeyQueryParams.lang]:
                this.route.snapshot.queryParams[RouteKeyQueryParams.lang]
            },
            queryParamsHandling: 'preserve'
          })
          .then();
        return;
      }

      // // for cancel booking proposal
      if (bookingStatus !== ReservationStatusEnum.Proposed) {
        this.router
          .navigate([RouterPageKey.bookingProposal, 'expiration'], {
            queryParams: {
              [RouteKeyQueryParams.hotelCode]:
                this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode],
              [RouteKeyQueryParams.lang]:
                this.route.snapshot.queryParams[RouteKeyQueryParams.lang]
            },
            queryParamsHandling: 'preserve'
          })
          .then();
        return;
      }
    })
  );
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
  currencyCode$ = this.store.pipe(select(selectorCurrencyCodeSelected));
  currencyRate$ = this.store.pipe(select(selectorHotelRate));
  availablePaymentMethodList$ = this.store.pipe(
    select(selectorAvailablePaymentMethodList),
    map((res) => (res?.length > 0 ? res : []))
  );

  locale$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang] || MultiLangEnum.EN)
  );
  hotelTerms$: Observable<string> = this.store.pipe(select(selectorHotelTerms));
  hotelPrivacy$: Observable<string> = this.store.pipe(
    select(selectorHotelPrivacy)
  );
  isCityTaxInclusive$ = this.store.pipe(select(selectorHotelCityTax));
  hotelCountry$ = this.store.pipe(select(selectorCountry));
  colorText$ = this.hotelConfigService.colorText$;
  isHotelInclusive$ = this.store.pipe(select(selectorIsInclusive));
  hotelTaxInformationSetting$: Observable<{
    [key: string]: string;
  }> = this.store.pipe(select(selectorHotelTaxInformation));
  hotelName$: Observable<string> = this.store.pipe(select(selectorHotelName));
  isLowestPriceOpaque$ = this.store.pipe(select(selectorLowestPriceOpaque));
  lowestPriceImageUrl$ = this.store.select(selectorLowestPriceImageUrl);
  timezone$ = this.hotelConfigService.hotelTimezone;
  colorPrimary$ = this.hotelConfigService.hotelPrimaryColor$;
  colorSecondaryText$ = this.hotelConfigService.colorSecondaryText$;

  ngOnInit(): void {
    const id: string =
      this.route.snapshot.queryParams[RouteKeyQueryParams.paymentId];

    // loadRatePlanList
    this.suggestionHandlerService.loadRatePlanList();

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
                // statusList: [BookingStatusEnum.Proposed, BookingStatusEnum.Cancelled]
              }
            }
          })
        );
      });
  }
}
