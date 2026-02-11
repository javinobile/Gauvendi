import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HotelService } from '@app/apis/hotel.service';
import { PaymentService } from '@app/apis/payment.service';
import { SpaceTypeCategoryCode } from '@app/constants/space-type.const';
import { SESSION_STORAGE_KEY } from '@app/constants/storage.const';
import { PaymentResultLoadingComponent } from '@app/modules/site/pages/booking-confirmation/components/payment-result-loading/payment-result-loading.component';
import { CheckInfoCompanyPipe } from '@app/modules/site/pipes/check-info-company.pipe';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SojernService } from '@app/services/sojern.service';
import { ACTION_BEHAVIOUR } from '@app/services/tracking-behaviour.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { TrackingService } from '@app/services/tracking.service';
import { BookingSummaryPanelComponent } from '@app/shared/components/booking-summary-panel/booking-summary-panel.component';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { DateWithLocaleAndTimezonePipe } from '@app/shared/pipes/date-with-locale-and-timezone.pipe';
import { DisplayTaxInformationPipe } from '@app/shared/pipes/display-tax-information.pipe';
import { GetArrivalPipe } from '@app/shared/pipes/get-arrival.pipe';
import { GetDeparturePipe } from '@app/shared/pipes/get-departure.pipe';
import { GetTaxInformationConfigByLocalePipe } from '@app/shared/pipes/get-tax-information-config-by-locale.pipe';
import { GroupArrayPipe } from '@app/shared/pipes/group-array.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import { selectorCppBookingSummary } from '@app/store/booking-summary/booking-summary.selectors';
import { loadAvailableAmenityByDistributionChannel } from '@app/store/pick-extras/pick-extras.actions';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  AmenityDistributionChannelEnum,
  Booking,
  Country,
  HotelTemplateEmail,
  HotelTemplateEmailCode
} from '@core/graphql/generated/graphql';
import { select } from '@ngrx/store';
import { loadCppBookingSummary } from '@store/booking-summary/booking-summary.actions';
import {
  selectorCountry,
  selectorHotelAddress,
  selectorHotelAddressState,
  selectorHotelCity,
  selectorHotelName,
  selectorHotelPhone,
  selectorHotelPostalCode,
  selectorHotelRate,
  selectorHotelTaxInformation,
  selectorHotelUrl,
  selectorIsInclusive,
  selectorLowestPriceImageUrl,
  selectorLowestPriceOpaque
} from '@store/hotel/hotel.selectors';
import { loadStaticContent } from '@store/multi-lang/multi-lang.actions';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { selectorAvailableAmenitiesByDistributionChannel } from '@store/pick-extras/pick-extras.selectors';
import * as moment from 'moment';
import { combineLatest, map, Observable, pipe, Subject } from 'rxjs';
import { distinctUntilChanged, skipWhile, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { AbstractSpaceTypeComponent } from '../../components/abstracts/abstract-space-type.component';
import { PaymentAndCancellationTemplateComponent } from '../../components/payment-and-cancellation-template/payment-and-cancellation-template.component';
import { BookerInformationComponent } from './components/booker-information/booker-information.component';
import { BookingCompanyInfoComponent } from './components/booking-company-information/booking-company-info.component';
import { BookingPaymentMethodComponent } from './components/booking-payment-method/booking-payment-method.component';
import { GuestInformationComponent } from './components/guest-information/guest-information.component';
import { GetHotelCountryPipe } from './pipes/get-hotel-country.pipe';
import { GroupGuestsByReservationPipe } from './pipes/group-guests-by-reservation.pipe';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [
    BookerInformationComponent,
    BookingCompanyInfoComponent,
    BookingPaymentMethodComponent,
    BookingSummaryPanelComponent,
    CheckInfoCompanyPipe,
    CommonModule,
    DateWithLocaleAndTimezonePipe,
    DisplayTaxInformationPipe,
    FilterSvgDirective,
    GetArrivalPipe,
    GetDeparturePipe,
    GetHotelCountryPipe,
    GetTaxInformationConfigByLocalePipe,
    GroupGuestsByReservationPipe,
    GuestInformationComponent,
    MatDialogModule,
    MatIconModule,
    PaymentResultLoadingComponent,
    TranslatePipe,
    PaymentAndCancellationTemplateComponent
  ],
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingConfirmationComponent extends AbstractSpaceTypeComponent {
  private googleTrackingService = inject(GoogleTrackingService);
  private hotelConfigService = inject(HotelConfigService);
  private trackingService = inject(TrackingService);
  private paymentService = inject(PaymentService);
  private sojernService = inject(SojernService);
  private hotelService = inject(HotelService);

  closingSection: string;
  signature: string;

  colorText$ = this.hotelConfigService.colorText$;
  locale$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang] || MultiLangEnum.EN)
  );
  availableAmenityByDistributionChannel$ = this.store.pipe(
    select(selectorAvailableAmenitiesByDistributionChannel)
  );
  bookingInformation$: Observable<Booking> = this.store.pipe(
    select(selectorCppBookingSummary),
    skipWhile((data) => !data),
    tap((data) => {
      if (data) {
        const locale =
          this.route.snapshot.queryParams[RouteKeyQueryParams.lang] ||
          MultiLangEnum.EN;
        const timezone = this.hotelConfigService.hotelTimezone?.value;
        this.store.dispatch(
          loadAvailableAmenityByDistributionChannel({
            variables: {
              filter: {
                hotelCode:
                  this.route.snapshot.queryParams[
                    RouteKeyQueryParams.hotelCode
                  ],
                fromTime: moment(data?.arrival)
                  .tz(timezone)
                  .toDate()
                  .getTime()
                  ?.toString(),
                toTime: moment(data?.departure)
                  .tz(timezone)
                  .toDate()
                  .getTime()
                  ?.toString(),
                translateTo:
                  locale === MultiLangEnum.EN
                    ? null
                    : locale?.toLocaleUpperCase(),
                distributionChannelList: [
                  AmenityDistributionChannelEnum.GvSalesEngine,
                  AmenityDistributionChannelEnum.GvVoice
                ]
              }
            }
          })
        );
        this.bookingInfo.set(data);
        this.setRoomUnitInfoConfig();
      }
    })
  );

  hotelName$ = this.store.pipe(select(selectorHotelName));
  hotelEmailTemplate$;
  address$ = this.store.pipe(select(selectorHotelAddress));
  state$ = this.store.pipe(select(selectorHotelAddressState));
  phoneNumber$ = this.store.pipe(select(selectorHotelPhone));
  hotelUrl$ = this.store.select(pipe(selectorHotelUrl));
  countries$: Observable<Country[]> = this.hotelService.countryList();
  taxInformation$ = this.store.pipe(select(selectorHotelTaxInformation));
  currencyCode$ = this.store.pipe(select(selectorCurrencyCodeSelected));
  currencyRate$ = this.store.pipe(select(selectorHotelRate));
  isLowestPriceOpaque$ = this.store.pipe(select(selectorLowestPriceOpaque));
  lowestPriceImageUrl$ = this.store.select(selectorLowestPriceImageUrl);
  isHotelInclusive$ = this.store.pipe(select(selectorIsInclusive));
  hotelCountry$ = this.store.pipe(select(selectorCountry));
  timezone$ = this.hotelConfigService.hotelTimezone;
  city$ = this.store.pipe(select(selectorHotelCity));
  postalCode$ = this.store.pipe(select(selectorHotelPostalCode));
  colorPrimary$ = this.hotelConfigService.hotelPrimaryColor$;
  colorSecondaryText$ = this.hotelConfigService.colorSecondaryText$;

  bookingInfo = signal<Booking | null>(null);
  unitInfoConfigs = signal([]);

  destroy$ = new Subject();

  ngOnInit(): void {
    const hotelCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode];
    const lang = this.route.snapshot.queryParams[RouteKeyQueryParams.lang];
    const id: string =
      this.route.snapshot.queryParams[RouteKeyQueryParams.paymentId];

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

    this.hotelEmailTemplate$ = combineLatest([
      this.paymentService.hotelTemplateEmailList({
        filter: {
          hotelCode
        }
      }),
      this.locale$
    ]).pipe(
      map(([template, language]) => {
        if (template && language) {
          const hotelTemplate: HotelTemplateEmail[] =
            template?.data as HotelTemplateEmail[];
          return hotelTemplate.find(
            (item) =>
              item?.languageCode?.toUpperCase() === language?.toUpperCase() &&
              item?.code === HotelTemplateEmailCode.BookingConfirmationV2
          );
        }

        return null;
      }),
      tap((res) => {
        this.closingSection = res?.closingSection;
        this.signature = res?.signature;
      })
    );

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

    // Handle tracking
    this.hotelName$.subscribe((hotelName: string) => {
      const url = 'payment-result';
      const name = 'Booking Summary';

      // Page name change
      window.document.title = `${hotelName} - GauVendi ISE - ${name}`;

      // Push to GTM
      this.googleTrackingService.pushPageView(name);

      // Push to Mixpanel
      this.trackingService.track(
        `${MixpanelKeys.Navigation}: ${name}`,
        { pageName: name },
        ACTION_BEHAVIOUR.VIEW
      );
    });

    // Scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  ngOnDestroy(): void {
    this.sojernService.removeAllScript();
    this.destroy$.next(null);
    this.destroy$.complete();
    sessionStorage.setItem(SESSION_STORAGE_KEY.SESSION_USER_ID, uuidv4());
  }

  backToHomePage(): void {
    const hotelCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode];
    const lang = this.route.snapshot.queryParams[RouteKeyQueryParams.lang];
    const currencyCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.currency];
    window.open(
      `/${hotelCode}?${RouteKeyQueryParams.lang}=${lang}&${RouteKeyQueryParams.currency}=${currencyCode}`,
      '_self'
    );
  }

  setRoomUnitInfoConfig(): void {
    const bookingInfo = this.bookingInfo();
    if (!bookingInfo) {
      this.unitInfoConfigs.set([]);
      return;
    }

    const reservationList = bookingInfo.reservationList;
    const totalAdult = reservationList?.reduce(
      (acc, curr) => acc + curr.adult,
      0
    );
    const totalChildren = reservationList?.reduce(
      (acc, curr) => acc + curr.childrenAgeList?.length,
      0
    );
    const totalPets = bookingInfo.reservationList?.reduce(
      (acc, curr) => acc + curr.pets,
      0
    );
    const features = bookingInfo.reservationList[0]?.matchedFeatureList;

    const featureSelected = features.filter(
      (feature) => feature.code?.startsWith('SPT_') // Filter space type features
    );

    const summarySpaceTypes = new GroupArrayPipe().transform(
      bookingInfo.reservationList,
      'matchedFeatureList',
      'code',
      SpaceTypeCategoryCode,
      'code',
      'retailFeatureImageList[0].imageUrl',
      'name'
    );

    this.unitInfoConfigs.set([
      ...summarySpaceTypes.map((item) => ({
        label: item.description,
        pluralLabel: item.description,
        icon: item.value || 'assets/icons/bedroom.svg',
        value: item.count,
        isPluralLabel: item.count > 1
      })),
      {
        label: '',
        pluralLabel: '',
        icon: '',
        value: null,
        isPluralLabel: false,
        isDivider: true
      },
      {
        label: 'ADULT',
        pluralLabel: 'ADULTS',
        icon: 'assets/icons/adults.svg',
        value: totalAdult,
        isPluralLabel: totalAdult > 1
      },
      {
        label: 'CHILD',
        pluralLabel: 'CHILDREN',
        icon: 'assets/icons/kid.svg',
        value: totalChildren,
        isPluralLabel: totalChildren > 1
      },
      {
        label: 'PET',
        pluralLabel: 'PETS',
        icon: 'assets/icons/pet.svg',
        value: totalPets,
        isPluralLabel: totalPets > 1
      }
    ]);
  }
}
