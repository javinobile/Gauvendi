import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, Scroll } from '@angular/router';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import { CartItem } from '@app/models/cart.model';
import { CartService } from '@app/services/cart.service';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import {
  selectorEventFeatureRecommendationList,
  selectorHotelRetailCategoryList,
  selectorHotelRetailFeatureList
} from '@app/store/hotel/hotel.selectors';
import { select, Store } from '@ngrx/store';
import { distinctUntilChanged, filter, map, skipWhile, tap } from 'rxjs';
import { IseConfiguratorMobileComponent } from '../ise-configurator-mobile/ise-configurator-mobile.component';
import { IseConfiguratorComponent } from '../ise-configurator/ise-configurator.component';
import { SearchBarMobileComponent } from '../search-bar-mobile/search-bar-mobile.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    IseConfiguratorComponent,
    ReactiveFormsModule,
    SearchBarComponent,
    SearchBarMobileComponent,
    IseConfiguratorMobileComponent
  ]
})
export class CalendarComponent implements OnInit {
  private readonly config$ = inject(HotelConfigService);
  private readonly route$$ = inject(ActivatedRoute);
  private readonly router$$ = inject(Router);
  private readonly store$$ = inject(Store);
  private readonly suggestionService$$ = inject(SuggestionHandlerService);
  private readonly cartService$ = inject(CartService);
  private readonly commonService = inject(CommonService);

  hotelRetailCategoryList$ = this.store$$.pipe(
    select(selectorHotelRetailCategoryList),
    map((data) => data?.filter((category) => category?.code !== 'SPT'))
  );
  hotelRetailFeatureList$ = this.store$$.pipe(
    select(selectorHotelRetailFeatureList)
  );
  eventFeatureRecommendationList$ = this.store$$.pipe(
    select(selectorEventFeatureRecommendationList)
  );

  locale$ = signal(null);

  selectedIndex: number = 0;

  readonly isCalendarDisplayed = signal(true);

  readonly primaryColor$ = this.config$.hotelPrimaryColor$;

  isAccomodationCombinedCtrl = new FormControl(false);

  isAccommodationCombined = this.route$$.queryParams.pipe(
    map((queryParams) => queryParams[RouteKeyQueryParams.combined] === 'true'),
    distinctUntilChanged(),
    tap((isChecked) => this.isAccomodationCombinedCtrl.patchValue(isChecked))
  );

  isMobile$ = this.commonService.isMobile$;

  ngOnInit(): void {
    this.isAccommodationCombined.subscribe();

    this.router$$.events
      .pipe(
        filter(
          (event) => event instanceof NavigationEnd || event instanceof Scroll
        ),
        map((event: NavigationEnd | Scroll) =>
          event instanceof NavigationEnd ? event?.url : event?.routerEvent?.url
        ),
        distinctUntilChanged(),
        tap((url) => {
          this.isCalendarDisplayed.set(
            url?.includes('/recommendation') || url?.includes('/pick-extras')
          );
        })
      )
      .subscribe();

    this.route$$.queryParams
      .pipe(
        map((queryParams) => queryParams[RouteKeyQueryParams.numberOfRoom]),
        distinctUntilChanged(),
        tap((roomDetails) => {
          const splitDetails = roomDetails?.split(',');
          if (splitDetails?.length > 0) {
            const cartItems = splitDetails
              ?.map((item, idx) => {
                const guestInfo = item?.split('-');
                if (guestInfo?.length > 0) {
                  let cartItem: CartItem = {
                    idx,
                    adults: +guestInfo[0],
                    selectedFeatures: [],
                    promoCode: null
                  };
                  let children = [];
                  let pets = 0;
                  for (let i = 1; i < guestInfo.length; i++) {
                    if (guestInfo[i]?.startsWith('p')) {
                      pets = +guestInfo[i]?.slice(1);
                    } else {
                      children.push(+guestInfo[i]);
                    }
                  }

                  cartItem = { ...cartItem, children, pets };
                  this.cartService$.setCartByIdx(idx, {
                    ...this.cartService$.getCartByIdx(idx),
                    ...cartItem
                  });

                  return cartItem;
                } else {
                  return null;
                }
              })
              ?.filter((item) => !!item);
          }
        })
      )
      .subscribe();

    this.route$$.queryParams
      .pipe(
        map((queryParams) => ({
          locale: queryParams[RouteKeyQueryParams.lang],
          roomDetails: queryParams[RouteKeyQueryParams.numberOfRoom]
        })),
        distinctUntilChanged(
          (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
        ),
        tap(({ locale, roomDetails }) => {
          const isLocaleChange = !!this.locale$() || this.locale$() !== locale;
          if (locale && roomDetails && isLocaleChange) {
            this.suggestionService$$.initConfigurator(locale);
            this.locale$.set(locale);
          }
        })
      )
      .subscribe();

    this.route$$.queryParams
      .pipe(
        map((queryParams) => queryParams[RouteKeyQueryParams.active]),
        distinctUntilChanged(),
        skipWhile((val) => !val),
        tap((val) => {
          this.selectedIndex = +val;
        })
      )
      .subscribe();

    this.isAccomodationCombinedCtrl.valueChanges
      .pipe(
        distinctUntilChanged(),
        tap((isChecked) => {
          this.router$$.navigate([], {
            relativeTo: this.route$$,
            queryParams: {
              ...this.route$$.snapshot.queryParams,
              [RouteKeyQueryParams.combined]: isChecked
            },
            queryParamsHandling: 'merge'
          });
        })
      )
      .subscribe();
  }
}
