import { ConnectedPosition } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { CommonService } from '@app/services/common.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SearchBarHandlerService } from '@app/services/search-bar-handler.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { TrackingService } from '@app/services/tracking.service';
import { IOptionUnitsInfo } from '@app/shared/components/option-units-info/interfaces/option-units-info.interface';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import { SearchBarOverlayState } from '@models/search-bar-overlay-state';
import { select, Store } from '@ngrx/store';
import {
  selectorDefaultPax,
  selectorNearestAvailableDailyRate
} from '@store/hotel/hotel.selectors';
import { DateUtils } from '@utils/DateUtils';
import { isValid, parse } from 'date-fns';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, skipWhile } from 'rxjs/operators';
import { CalendarOverlayComponent } from '../calendar-overlay/calendar-overlay.component';
import { TravelOverlayComponent } from '../travel-overlay/travel-overlay.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: ''
})
export abstract class SearchBarAbstractComponent
  implements OnInit, AfterViewInit {
  protected bookingTransactionService = inject(BookingTransactionService);
  protected route = inject(ActivatedRoute);
  protected store = inject(Store);
  protected appRouterService = inject(AppRouterService);
  protected trackingService = inject(TrackingService);
  protected suggestionHandlerService = inject(SuggestionHandlerService);
  protected searchBarHandlerService = inject(SearchBarHandlerService);
  protected router = inject(Router);
  protected hotelConfigService = inject(HotelConfigService);
  protected destroyRef = inject(DestroyRef);
  protected configuratorService = inject(ConfiguratorService);
  protected commonService = inject(CommonService);

  summary$ = combineLatest([
    this.bookingTransactionService.dateSelected$,
    this.bookingTransactionService.travelerSelected$,
    this.bookingTransactionService.promoCode$
  ]).pipe(
    map(([dateSelected, travelerSelected, promoCode]) => {
      this.compareChangingData({ dateSelected, travelerSelected, promoCode });
      if (!dateSelected && !travelerSelected) {
        return null;
      }

      const from = dateSelected?.from;
      const to = dateSelected?.to;
      const rooms = travelerSelected?.toString()?.split(',') || [];

      const { adults, children, pets } = this.calculateTotals(rooms);

      const parseDate = (date: string) =>
        date ? parse(date, 'dd-MM-yyyy', new Date()) : null;

      this.unitInfo$.set({
        adults,
        children,
        pets,
        totalRoom: rooms.length
      });

      return {
        arrival: parseDate(from),
        departure: parseDate(to),
        dateRange: [parseDate(from), parseDate(to)],
        totalRoom: rooms.length,
        adults,
        children,
        pets,
        promoCode
      };
    })
  );

  unitInfo$ = signal<IOptionUnitsInfo>(null);

  defaultPax$ = this.store.pipe(
    select(selectorDefaultPax),
    distinctUntilChanged(
      (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
    ),
    skipWhile((data) => !data)
  );
  nearestAvailable$ = this.store.pipe(
    select(selectorNearestAvailableDailyRate)
  );
  locale$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang])
  );
  promoCtrl = new FormControl();
  isOpenInputMode = false;
  travelOverlay = TravelOverlayComponent;
  calendarOverlay = CalendarOverlayComponent;
  connectedPosition: ConnectedPosition[] = [
    {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetX: null,
      offsetY: null,
      panelClass: 'bottom-center'
    }
  ];
  searchBarOverlayState = SearchBarOverlayState;
  activeSection$ = this.searchBarHandlerService.openOverlayState$;
  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;
  textColor$ = this.hotelConfigService.colorText$;
  buttonTextColor$ = this.hotelConfigService.buttonTextColor$;

  isContentInitted = false;

  //#region Search Button
  isSearched = signal(false);
  selectedFeatures = this.configuratorService.featureSelected;
  isFeatureChanged = computed(() => {
    const currentFeatures = this.bookingTransactionService.getSelectedFeatures(
      this.route.snapshot.queryParams
    );
    const selectedFeatures = this.selectedFeatures() || [];

    const hasSameFeatures =
      currentFeatures.length === selectedFeatures.length &&
      currentFeatures.every((feature) => selectedFeatures.includes(feature));

    this.commonService.isFeatureChanged.next(
      !hasSameFeatures && !this.isSearched()
    );
    return !hasSameFeatures && !this.isSearched();
  });
  isRoomSummaryChanged = signal(false);
  isSearchChanged = computed(() => {
    const isChanged = this.isRoomSummaryChanged() || this.isFeatureChanged();
    this.commonService.isSearchBarChanged.next(isChanged);
    return isChanged;
  });
  //#endregion

  ngAfterViewInit(): void {
    this.isContentInitted = true;
  }

  ngOnInit(): void {
    this.loadTravelDate();
    this.loadTraveler();

    this.bookingTransactionService.clearPromoCode$
      .pipe(
        skipWhile((data) => !data),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.clearPromo());
  }

  private calculateTotals(rooms: string[]) {
    return rooms.reduce(
      (acc, room) => {
        const [adults, ...rest] = room.split('-');
        return {
          adults: acc.adults + +adults,
          children: acc.children + rest.filter((x) => !x.includes('p')).length,
          pets:
            acc.pets +
            (+rest.find((x) => x.includes('p'))?.replace('p', '') || 0)
        };
      },
      { adults: 0, children: 0, pets: 0 }
    );
  }

  compareChangingData({ dateSelected, travelerSelected, promoCode }) {
    const queryParams = this.route.snapshot.queryParams;

    const isChanged =
      (queryParams[RouteKeyQueryParams.checkInDate] || '') !==
      (dateSelected?.from || '') ||
      (queryParams[RouteKeyQueryParams.checkOutDate] || '') !==
      (dateSelected?.to || '') ||
      (queryParams[RouteKeyQueryParams.numberOfRoom] || '') !==
      (travelerSelected || '') ||
      (queryParams[RouteKeyQueryParams.promoCode] || '') !== (promoCode || '');

    this.isRoomSummaryChanged.set(isChanged);
  }

  clearPromo(): void {
    this.promoCtrl.patchValue(null);
    this.bookingTransactionService.promoCode$.next(null);
    this.isOpenInputMode = false;
  }

  onBlur(): void {
    this.isOpenInputMode = this.promoCtrl?.value?.trim()?.length > 0;
    this.bookingTransactionService.promoCode$.next(
      this.promoCtrl?.value?.trim()
    );
    this.trackingService.track(MixpanelKeys.InputPromoCode, {
      promo_code: this.promoCtrl?.value?.trim()
    });
  }

  loadTravelDate(): void {
    const promoCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.promoCode];
    const checkInDate =
      this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate];
    const checkOutDate =
      this.route.snapshot.queryParams[RouteKeyQueryParams.checkOutDate];
    if (promoCode) {
      this.isOpenInputMode = true;
      this.promoCtrl.patchValue(promoCode);
    }
    this.bookingTransactionService.promoCode$.next(promoCode);

    if (checkInDate && checkOutDate) {
      const checkInDateParse = parse(checkInDate, 'dd-MM-yyyy', new Date());
      const checkOutDateParse = parse(checkOutDate, 'dd-MM-yyyy', new Date());

      if (!isValid(checkInDateParse) || !isValid(checkOutDateParse)) {
        this.nearestAvailable$
          .pipe(
            skipWhile((data) => !data),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((data) => {
            this.bookingTransactionService.dateSelected$.next(null);
            if (data?.length > 0) {
              const { arrival, departure } = data[0];
              const checkIn = moment(DateUtils.safeDate(arrival));
              const checkOut = moment(DateUtils.safeDate(departure));
              this.setDateDefault(
                checkIn?.format('DD-MM-yyyy'),
                checkOut?.format('DD-MM-yyyy')
              );
            }
          });
      } else {
        this.bookingTransactionService.dateSelected$.next({
          from: checkInDate,
          to: checkOutDate
        });
      }
    } else {
      this.nearestAvailable$
        .pipe(
          skipWhile((data) => !data),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((data) => {
          this.bookingTransactionService.dateSelected$.next(null);
          if (data?.length > 0) {
            const { arrival, departure } = data[0];
            const checkIn = moment(DateUtils.safeDate(arrival));
            const checkOut = moment(DateUtils.safeDate(departure));
            this.setDateDefault(
              checkIn?.format('DD-MM-yyyy'),
              checkOut?.format('DD-MM-yyyy')
            );
          }
        });
    }
  }

  setDateDefault(checkInDefault: string, checkOutDefault: string): void {
    this.bookingTransactionService.dateSelected$.next({
      from: checkInDefault,
      to: checkOutDefault
    });
    setTimeout(() => {
      let queryParams = { ...this.route.snapshot.queryParams };
      queryParams = {
        ...queryParams,
        [RouteKeyQueryParams.checkInDate]: checkInDefault,
        [RouteKeyQueryParams.checkOutDate]: checkOutDefault
      };
      this.appRouterService.updateRouteQueryParams(queryParams);
    }, 150);
  }

  loadTraveler(): void {
    this.bookingTransactionService.travelerSelected$.next(null);
    this.defaultPax$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pax) => {
        const numberOfRoom =
          this.route.snapshot.queryParams[RouteKeyQueryParams.numberOfRoom];
        const traveler =
          this.bookingTransactionService.getTraveler(numberOfRoom);
        if (traveler?.adults >= 1) {
          this.bookingTransactionService.travelerSelected$.next(numberOfRoom);
        } else {
          this.setDefaultPax(pax, 1000);
          this.bookingTransactionService.travelerSelected$.next(
            pax?.toString() || '1'
          );
        }
      });
  }

  setDefaultPax(pax: number, timoutTime = 100): void {
    setTimeout(() => {
      let queryParams = { ...this.route.snapshot.queryParams };
      queryParams = {
        ...queryParams,
        [RouteKeyQueryParams.numberOfRoom]: pax || 1
      };
      this.appRouterService.updateRouteQueryParams(queryParams);
    }, timoutTime);
  }

  onSearch(): void {
    this.isSearched.set(true);
    this.isRoomSummaryChanged.set(false);
    this.searchBarHandlerService.overlayRefList$
      ?.getValue()
      ?.forEach((ref) => ref?.detach());
    this.searchBarHandlerService.openOverlayState$.next(null);
    this.configuratorService.isCollapse.set(true);
    this.configuratorService.minimalView.set(true);
    this.bookingTransactionService.updateQueryParams(() => {
      if (this.router?.url) {
        const currentStep = this.router?.url.split('?')[0];

        if (currentStep.indexOf('recommendation') !== -1) {
          this.suggestionHandlerService.loadAvailableStayOptions();
          this.suggestionHandlerService.loadWidgetEventFeatureRecommendationList();
        } else {
          const value = this.route.snapshot.queryParams;
          const recommendationParam = {
            ...this.createParam([RouteKeyQueryParams.hotelCode], value),
            ...this.createParam([RouteKeyQueryParams.currency], value),
            ...this.createParam([RouteKeyQueryParams.checkInDate], value),
            ...this.createParam([RouteKeyQueryParams.checkOutDate], value),
            ...this.createParam([RouteKeyQueryParams.numberOfRoom], value),
            ...this.createParam([RouteKeyQueryParams.travelTags], value),
            ...this.createParam([RouteKeyQueryParams.occasions], value),
            ...this.createParam([RouteKeyQueryParams.lang], value),
            ...this.createParam([RouteKeyQueryParams.promoCode], value),
            ...this.createParam([RouteKeyQueryParams.bookingSrc], value)
          };
          this.trackingService.track(MixpanelKeys.ClickSearch);
          this.router
            .navigate([RouterPageKey.recommendation], {
              queryParams: recommendationParam
            })
            .then(() => {
              this.suggestionHandlerService.loadAvailableStayOptions();
            });
        }
        this.isSearched.set(false);
      }
    });
  }

  createParam(code, object = null): any {
    return { [code]: (object && object[code]) || null };
  }
}
