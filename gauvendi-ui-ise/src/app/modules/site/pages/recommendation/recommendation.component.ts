import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { DataLayerEvents, DataLayerKeys } from '@app/constants/datalayer.enum';
import { MixpanelKeys } from '@app/constants/mixpanel.keys';
import { RouteKeyQueryParams, RouterPageKey } from '@app/constants/RouteKey';
import {
  BookingFlow,
  HotelRetailCategory,
  RatePlan,
  RfcRatePlan,
  StayOptionSuggestion
} from '@app/core/graphql/generated/graphql';
import { ViewportService } from '@app/core/services/viewport.service';
import { CartItem } from '@app/models/cart.model';
import { EDisplayMode } from '@app/models/display-mode.model';
import {
  EFilterType,
  EPriceView,
  ICombinationOptionItem
} from '@app/models/option-item.model';
import { RecommendationFlow } from '@app/models/recommendation-flow';
import { PriceRangeMobileComponent } from '@app/modules/site/pages/recommendation/components/price-range-mobile/price-range-mobile.component';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { CartService } from '@app/services/cart.service';
import { CommonService } from '@app/services/common.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SearchBarHandlerService } from '@app/services/search-bar-handler.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { TrackingService } from '@app/services/tracking.service';
import { IseLoadingComponent } from '@app/shared/components/ise-loading/ise-loading.component';
import { RoomSummaryLabelComponent } from '@app/shared/components/room-summary-label/room-summary-label.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  selectorCurrencyCodeSelected,
  selectorCurrentPage
} from '@app/state-management/router.selectors';
import {
  selectorEventFeatureRecommendationList,
  selectorHotelRate,
  selectorHotelRetailCategoryList,
  selectorHotelRetailFeatureList,
  selectorIsInclusive,
  selectorLowestPriceImageUrl,
  selectorLowestPriceOpaque
} from '@app/store/hotel/hotel.selectors';
import {
  selectorCombinedAccommodationList,
  selectorCombinedAccommodationListLoading,
  selectorDirectStayOption,
  selectorHotelAvailableAmenities,
  selectorRatePlanList,
  selectorStayOptionBundleList,
  selectorStayOptionSuggestionList,
  selectorStayOptionSuggestionListLoaded,
  selectorStayOptionSuggestionListStatus
} from '@app/store/suggestion/suggestion.selectors';
import { ELoadingStatus } from '@models/loading-status.model';
import { select, Store } from '@ngrx/store';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { loadAvailableAmenity } from '@store/suggestion/suggestion.actions';
import { Scroller } from '@utils/scroller.util';
import { isValid, parse } from 'date-fns';
import { sum } from 'lodash';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  skipWhile,
  Subject,
  takeUntil,
  tap
} from 'rxjs';
import { OverlayMobileDirective } from '../../directives/overlay-mobile.directive';
import { ChooseViewModeComponent } from './components/choose-view-mode/choose-view-mode.component';
import { DirectStayOptionComponent } from './components/direct-stay-option/direct-stay-option.component';
import { OptionListComponent } from './components/option-list/option-list.component';
import { OptionsSkeletonComponent } from './components/options-skeleton/options-skeleton.component';
import { PriceRangeDesktopComponent } from './components/price-range-desktop/price-range-desktop.component';
import { SpaceTypeMobileComponent } from './components/space-type-mobile/space-type-mobile.component';
import { FilterMatchItemsPipe } from './pipes/filter-match-items.pipe';
import { FilterPriceRangeItemsPipe } from './pipes/filter-price-range-items.pipe';
import { FilterPromotionItemsPipe } from './pipes/filter-promotion-items.pipe';
import { FilterSpaceTypeItemsPipe } from './pipes/filter-space-type.pipe';
import { RenderAccommodationLeftPipe } from './pipes/render-accommodation-left.pipe';
import { OptionUtil } from './utils/option.util';

@Component({
  selector: 'app-recommendation',
  templateUrl: './recommendation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ChooseViewModeComponent,
    OptionsSkeletonComponent,
    DirectStayOptionComponent,
    FormsModule,
    ReactiveFormsModule,
    OptionListComponent,
    FilterMatchItemsPipe,
    TranslatePipe,
    FilterSvgDirective,
    OverlayMobileDirective,
    CustomTooltipModule,
    RenderAccommodationLeftPipe,
    FilterPromotionItemsPipe,
    IseLoadingComponent,
    RoomSummaryLabelComponent,
    MatMenuModule,
    FilterPriceRangeItemsPipe,
    SpaceTypeMobileComponent,
    PriceRangeDesktopComponent,
    FilterSpaceTypeItemsPipe
  ]
})
export class RecommendationComponent implements OnInit, OnDestroy {
  private readonly commonService = inject(CommonService);
  readonly viewportService = inject(ViewportService);
  private store: Store = inject(Store);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private suggestionHandlerService: SuggestionHandlerService = inject(
    SuggestionHandlerService
  );
  private appRouterService: AppRouterService = inject(AppRouterService);
  private bookingTransactionService: BookingTransactionService = inject(
    BookingTransactionService
  );
  private router: Router = inject(Router);
  protected trackingService: TrackingService = inject(TrackingService);
  protected googleTrackingService: GoogleTrackingService = inject(
    GoogleTrackingService
  );
  private hotelConfigService: HotelConfigService = inject(HotelConfigService);
  private readonly cartService: CartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly routerPageKey = RouterPageKey;
  protected readonly ELoadingStatus = ELoadingStatus;
  @ViewChild('wrapper', { static: false }) wrapperEle: ElementRef;
  @ViewChild('scrollTo', { static: false }) target: ElementRef;
  activeMode: EDisplayMode = EDisplayMode.Grid;
  EDisplayMode = EDisplayMode;
  EFilterType = EFilterType;
  OptionUtil = OptionUtil;
  searchBarHandlerService = inject(SearchBarHandlerService);
  configuratorService = inject(ConfiguratorService);
  stayOptionSuggestionLoaded$ = this.store.pipe(
    select(selectorStayOptionSuggestionListLoaded)
  );
  stayOptionSuggestionStatus$ = this.store.pipe(
    select(selectorStayOptionSuggestionListStatus)
  );

  items$ = this.store.pipe(
    select(selectorStayOptionSuggestionList),
    distinctUntilChanged(
      (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
    ),
    tap((data) => {
      if (data?.length > 0) {
        const lowestOption = data?.[0] as StayOptionSuggestion;

        setTimeout(() => {
          // add lowest price option into query param for tracking
          this.appRouterService.updateRouteQueryParams({
            ...this.route.snapshot.queryParams,
            [RouteKeyQueryParams.lowestCode]: lowestOption?.availableRfcList
              ?.map((x) => x?.code)
              ?.join('~'),
            [RouteKeyQueryParams.lowestSalesPlan]:
              lowestOption?.availableRfcRatePlanList?.[0]?.ratePlan?.code
          });
        }, 150);
      }
    }),
    map((data) => {
      const newData = data
        ?.map((i: StayOptionSuggestion) =>
          OptionUtil.mappingCombinationOptionItem(i)
        )
        ?.sort((_a, b) => (!b.isLocked ? 1 : -1))
        ?.sort((a, b) => b.matchPercent - a.matchPercent);

      return newData;
    })
  );

  bundleItems$ = this.store.pipe(
    select(selectorStayOptionBundleList),
    map((data) =>
      OptionUtil.mappingBundleItem(
        data?.map((i: StayOptionSuggestion) =>
          OptionUtil.mappingCombinationOptionItem(i)
        )
      )
    )
  );

  roomSummary$ = this.commonService.roomSummary$;
  filterType$ = of(EFilterType.SINGLE);
  priceRange$: Observable<{ max: number; min: number }> =
    this.route.queryParams.pipe(
      map((params) => params[RouteKeyQueryParams.priceFilter]),
      distinctUntilChanged(),
      map((priceRange) => (priceRange ? priceRange.split('-') : null)),
      map((res) => {
        if (res) {
          return {
            min: res?.[0],
            max: res?.[1]
          };
        }
        return res;
      })
    );

  taxDisplayDefault$ = combineLatest([
    of(this.route.snapshot.queryParams[RouteKeyQueryParams.includeTax] === '1'),
    this.store.select(selectorIsInclusive)
  ]).pipe(
    tap(([a, b]) => {
      this.taxCtrl.patchValue(a ? a : b);
    })
  );
  currencyRate$ = this.store.select(selectorHotelRate);
  currencyCode$ = this.store.select(selectorCurrencyCodeSelected);
  priceState$: Observable<EPriceView> = this.route.queryParams.pipe(
    map(() => EPriceView.PerNight)
  );

  specificRoom$ = this.store.pipe(
    select(selectorDirectStayOption),
    map((direct) => {
      // ignore direct room if searching with features
      if (direct && direct?.label !== BookingFlow.Match) {
        this.commonService.isDirectLink.set(true);
        return OptionUtil.mappingCombinationOptionItem({
          ...direct,
          label: BookingFlow.Direct
        });
      }

      return null;
    })
  );

  isMatchFlow$: Observable<boolean> = this.route.queryParams.pipe(
    map((params) => +params[RouteKeyQueryParams.customize] === 1)
  );

  isMobile$ = this.viewportService.isMobile$();
  isLowestPriceOpaque$ = this.store.pipe(select(selectorLowestPriceOpaque));
  lowestPriceImageUrl$ = this.store.select(selectorLowestPriceImageUrl);
  initSuccess$ = new Subject();
  availableAmenity$ = this.store.pipe(select(selectorHotelAvailableAmenities));
  themeColors$ = this.hotelConfigService.themeColors$;

  taxCtrl = new FormControl(false);
  priceRangeComponent = PriceRangeMobileComponent;
  tooltipLine1 = 'TOOLTIP_HOW_DO_WE_CALCULATE_PERCENTAGE_MATCHES_LINE_1';
  tooltipLine2 = 'TOOLTIP_HOW_DO_WE_CALCULATE_PERCENTAGE_MATCHES_LINE_2';
  tooltipConcatBy = '\n';
  hotelRetailCategoryList$ = this.store.pipe(
    select(selectorHotelRetailCategoryList),
    map((data) => data?.filter((category) => category?.code !== 'SPT'))
  );
  spaceTypeList$ = this.store.pipe(
    select(selectorHotelRetailFeatureList),
    map((data) =>
      data?.filter((feature) => feature?.hotelRetailCategory?.code === 'SPT')
    )
  );
  hotelRetailFeatureList$ = this.store.pipe(
    select(selectorHotelRetailFeatureList)
  );
  eventFeatureRecommendationList$ = this.store.pipe(
    select(selectorEventFeatureRecommendationList)
  );
  promoCode$ = this.route.queryParams.pipe(
    map((queryParam) => queryParam[RouteKeyQueryParams.promoCode])
  );

  salesPlanList$ = this.store.pipe(select(selectorRatePlanList));

  active$ = this.route.queryParams.pipe(
    map((queryParams) => queryParams[RouteKeyQueryParams.active]),
    distinctUntilChanged(),
    map((activeIdx) => (!activeIdx ? 0 : activeIdx)),
    tap((activeIdx) => this.activeTab.set(activeIdx)),
    map((activeIdx) => +activeIdx + 1)
  );

  activeTab = signal<number>(0);
  cart = computed(() => {
    const items = this.cartService.getCartAsync()();
    const activeItem = items[this.activeTab()];
    if (activeItem?.searchSnapshot) {
      return activeItem?.searchSnapshot as CartItem;
    }
    return activeItem;
  });

  readonly primaryColor$ = this.hotelConfigService.hotelPrimaryColor$;

  isAccommodationCombined = this.route.queryParams.pipe(
    map((queryParams) => queryParams[RouteKeyQueryParams.combined] === 'true'),
    distinctUntilChanged(),
    tap((isChecked) => {
      if (isChecked) {
        this.allInCart = this.cartService.getCart();
        this.suggestionHandlerService.loadCombinedAccommodationList();
      } else {
        this.allInCart = [];
      }
    })
  );
  combinedAccommodationList = this.store.pipe(
    select(selectorCombinedAccommodationList),
    map((data) =>
      data?.map((item) => OptionUtil.mappingCombinationOptionItem(item))
    )
  );
  combinedAccommodationListLoading = this.store.pipe(
    select(selectorCombinedAccommodationListLoading)
  );

  allInCart = this.cartService.getCart();

  // TODO: Convert to pipe
  countPeopleInCart(target: 'adult' | 'child' | 'pet'): number {
    switch (target) {
      case 'adult':
        return this.allInCart?.reduce((acc, val) => acc + +val?.adults, 0);
      case 'child':
        return this.allInCart?.reduce(
          (acc, val) => acc + +val?.children?.length,
          0
        );
      case 'pet':
        return this.allInCart?.reduce((acc, val) => acc + +val?.pets, 0);
    }
  }

  // selectedSpaceTypes = signal<string[]>([]);

  selectedSpaceType = this.commonService.selectedSpaceType;

  constructor() {}

  ngOnDestroy(): void {
    this.bookingTransactionService.dealAvgLowestPrice$.next(0);
  }

  ngOnInit() {
    combineLatest([
      this.store.pipe(select(selectorCurrentPage)),
      this.route.queryParams
    ])
      .pipe(
        skipWhile(([currentPage, queryParams]) => {
          const checkInDate = queryParams[RouteKeyQueryParams.checkInDate];
          const checkOutDate = queryParams[RouteKeyQueryParams.checkOutDate];
          const traveler = this.bookingTransactionService.getTraveler(
            queryParams[RouteKeyQueryParams.numberOfRoom]
          );

          if (checkInDate && checkOutDate) {
            const checkInDateParse = parse(
              checkInDate,
              'dd-MM-yyyy',
              new Date()
            );
            const checkOutDateParse = parse(
              checkOutDate,
              'dd-MM-yyyy',
              new Date()
            );

            return (
              currentPage !== 'recommendation' ||
              !queryParams[RouteKeyQueryParams.hotelCode] ||
              !isValid(checkOutDateParse) ||
              !isValid(checkInDateParse) ||
              traveler?.adults < 1 ||
              !queryParams[RouteKeyQueryParams.lang]
            );
          }

          return (
            currentPage !== 'recommendation' ||
            !queryParams[RouteKeyQueryParams.hotelCode] ||
            !queryParams[RouteKeyQueryParams.checkInDate] ||
            !queryParams[RouteKeyQueryParams.checkOutDate] ||
            traveler?.adults < 1 ||
            !queryParams[RouteKeyQueryParams.lang]
          );
        }),
        takeUntil(this.initSuccess$)
      )
      .subscribe(() => {
        const lang = this.route.snapshot.queryParams[RouteKeyQueryParams.lang];
        if (this.commonService.currentLang() !== lang) {
          this.commonService.currentLang.set(lang);
        }
        this.suggestionHandlerService.loadAvailableStayOptions();
        this.suggestionHandlerService.loadWidgetEventFeatureRecommendationList();
        this.initSuccess$.next(null);
        this.initSuccess$.complete();
        this.handleLanguageChange();
      });

    this.fillUpSpaceTypeOnStartup();
  }

  handleLanguageChange(): void {
    this.route.queryParams
      .pipe(
        debounceTime(200),
        map((params) => params[RouteKeyQueryParams.lang]),
        skipWhile((data) => !data),
        distinctUntilChanged(
          (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
        )
      )
      .subscribe((lang) => {
        if (this.commonService.currentLang() === lang) {
          return;
        }

        this.commonService.currentLang.set(lang);
        this.suggestionHandlerService.initConfigurator(
          lang === MultiLangEnum.EN ? null : lang?.toLocaleUpperCase()
        );
        this.suggestionHandlerService.loadAvailableStayOptions(
          ELoadingStatus.reloading
        );
      });
  }

  private fillUpSpaceTypeOnStartup(): void {
    this.route.queryParams
      .pipe(
        map((queryParams) => queryParams[RouteKeyQueryParams.spaceTypes]),
        skipWhile((spaceTypes) => !spaceTypes),
        distinctUntilChanged(),
        tap((spaceType) => this.selectedSpaceType.set(spaceType))
      )
      .subscribe();
  }

  onSelectRatePlan(
    ratePlanCode: string,
    combinationOption: ICombinationOptionItem,
    salesPlanList: RatePlan[]
  ) {
    const availableRfcList = combinationOption?.metadata?.availableRfcList;
    const queryParams = this.route.snapshot.queryParams;
    const listChildren = this.bookingTransactionService
      .getRoomRequestList(queryParams)
      .map((x) => x.childrenAgeList)
      .reduce((acc, val) => acc.concat(...val), []);
    const childInRoom = (totalChild: number) =>
      listChildren.splice(0, totalChild).join('-');

    const numberOfRoom = availableRfcList
      .map((val) => {
        const adultStr = sum([
          val?.allocatedAdultCount,
          val?.allocatedExtraBedAdultCount
        ]);
        const childStr =
          val.allocatedChildCount > 0 || val.allocatedExtraBedChildCount > 0
            ? '-' +
              childInRoom(
                sum([val.allocatedChildCount, val.allocatedExtraBedChildCount])
              )
            : '';
        const petStr =
          val.allocatedPetCount > 0 ? '-p' + val.allocatedPetCount : '';
        return `${adultStr}${childStr}${petStr}`;
      })
      .join(',');

    const roomStayOptionsCode = availableRfcList
      .reduce((acc) => acc + `~${combinationOption?.metadata?.label}`, '')
      .substring(1);

    const roomPlans = availableRfcList
      .reduce((acc, val) => {
        const plan = val.rfcRatePlanList.find(
          (item) => item?.ratePlan?.code === ratePlanCode
        );
        return acc + `~${plan?.code}`;
      }, '')
      .substring(1);

    const rfcCodeList = availableRfcList
      .reduce((acc, val) => {
        return acc + `~${val?.code}`;
      }, '')
      .substring(1);

    const rfcRatePlans = availableRfcList.map((x) =>
      x?.rfcRatePlanList?.find((y) => y?.ratePlan?.code === ratePlanCode)
    ) as RfcRatePlan[];
    const amenities = rfcRatePlans.map(
      (x) => x?.ratePlan?.includedHotelExtrasList || []
    );

    const mandatoryServiceCodeList = [];

    const selectedSalesPlan = salesPlanList?.find(
      (item) => item?.code === ratePlanCode
    );
    if (selectedSalesPlan?.mandatoryHotelExtrasList?.length > 0) {
      mandatoryServiceCodeList.push(
        ...selectedSalesPlan?.mandatoryHotelExtrasList?.map(
          (item) => item?.code
        )
      );
    }

    const roomServices = availableRfcList
      ?.map((_item, index) => {
        const services = [
          ...new Set([
            ...(amenities?.[index]?.map((amenity) => amenity?.code) || []),
            ...mandatoryServiceCodeList
          ])
        ];
        return services?.join(',');
      })
      ?.join('~');

    const selectedRfcRatePlan: RfcRatePlan =
      combinationOption?.metadata?.availableRfcRatePlanList?.find(
        (i) => i?.ratePlan?.code === ratePlanCode
      );
    const obj = {
      rfc_list: rfcCodeList,
      rate_plan_code: ratePlanCode,
      rate_plan_name: selectedRfcRatePlan?.ratePlan?.code,
      average_daily_rate: selectedRfcRatePlan?.averageDailyRate,
      total_selling_rate: selectedRfcRatePlan?.totalSellingRate,
      total_gross_amount: selectedRfcRatePlan?.totalGrossAmount,
      request_id:
        this.route.snapshot.queryParams[RouteKeyQueryParams.requestId],
      recommendation_id: combinationOption?.metadata?.['stayOptionUuid'],
      booking_flow: combinationOption?.metadata?.label
    };
    this.trackingService.track(MixpanelKeys.SelectRatePlan, obj);

    // navigation
    this.navigateToPickExtras({
      numberOfRoom,
      roomStayOptionsCode,
      rfcRatePlanCode: roomPlans,
      roomServices: roomServices !== 'undefined' ? roomServices : '',
      bookingFlow: combinationOption?.metadata?.label,
      rfcCodeList,
      ratePlanCode,
      recommendationId: combinationOption?.metadata?.['stayOptionUuid']
    });
  }

  navigateToPickExtras({
    numberOfRoom,
    roomStayOptionsCode,
    rfcRatePlanCode,
    roomServices,
    bookingFlow,
    rfcCodeList,
    ratePlanCode,
    recommendationId
  }): void {
    const room = rfcRatePlanCode?.split(/[_-]+/g)[0];
    const ratePlan = rfcRatePlanCode?.split(/[_-]+/g)[1];

    const hotelCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode];

    this.googleTrackingService.pushEvent(
      DataLayerEvents.selectRecommendedOptions,
      {
        [DataLayerKeys.selectedRatePlan]: ratePlan || null,
        [DataLayerKeys.selectedRoom]: room || null,
        [DataLayerKeys.hotelCode]: hotelCode?.toLocaleUpperCase()
      }
    );

    const currentQueryParams = this.route.snapshot.queryParams;

    const queryParams = {
      ...currentQueryParams,
      [RouteKeyQueryParams.numberOfRoom]: numberOfRoom,
      [RouteKeyQueryParams.roomStayOptionsCode]: roomStayOptionsCode,
      [RouteKeyQueryParams.roomPlans]: rfcRatePlanCode,
      [RouteKeyQueryParams.roomServices]: roomServices,
      [RouteKeyQueryParams.bookingFlow]: bookingFlow,
      [RouteKeyQueryParams.rfcCodes]: rfcCodeList,
      [RouteKeyQueryParams.ratePlanCode]: ratePlanCode,
      [RouteKeyQueryParams.recommendationId]: recommendationId
    };

    const arrival = this.bookingTransactionService.getArrival(queryParams);
    const departure = this.bookingTransactionService.getDeparture(queryParams);
    const locale = queryParams[RouteKeyQueryParams.lang];
    const translateTo =
      locale === MultiLangEnum.EN ? null : locale?.toLocaleUpperCase();
    const salesPlanCode = ratePlanCode;
    const roomProductCode = rfcCodeList?.split('~')[0];
    this.store.dispatch(
      loadAvailableAmenity({
        variables: {
          filter: {
            hotelCode,
            fromTime: arrival?.toString(),
            toTime: departure?.toString(),
            translateTo,
            salesPlanCode,
            roomProductCode,
            roomRequestList:
              this.bookingTransactionService.getRoomRequestList(queryParams)
          }
        }
      })
    );

    this.availableAmenity$
      .pipe(
        skipWhile((data) => !data),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        this.appRouterService.updateRouteQueryParams(queryParams, {
          navigateUrl:
            data?.length === 0
              ? RouterPageKey.summaryPayment
              : RouterPageKey.pickExtras,
          done: () => {
            // Scroll to top
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: 'smooth'
            });
          }
        });
      });
  }

  openConfiguratorMobile(): void {
    Scroller.scrollToTargetElement('headerWrapper');
    document.getElementById('iseConfiguratorElementMobile')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'start'
    });
    setTimeout(() => {
      const iseConfiguratorMobile = document.getElementById('categoryElement');
      if (iseConfiguratorMobile) {
        iseConfiguratorMobile?.click();
      }
    }, 200);
  }

  openIseConfiguratorElement(hotelRetailCategories: HotelRetailCategory[]) {
    Scroller.scrollToTargetElement('headerWrapper');
    setTimeout(() => {
      document.getElementById('iseConfiguratorElement')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
      this.configuratorService.isCollapse.set(false);
      if (!this.configuratorService.categorySelected()?.code) {
        this.configuratorService.categorySelected.set(
          hotelRetailCategories?.[0]
        );
      }
    }, 100);
  }

  bookAnotherDate() {
    const isMobile = window.innerWidth <= 800;
    if (isMobile) {
      const searchBarMobile = document.getElementById('searchBarMobile');
      if (searchBarMobile) {
        searchBarMobile?.click();
      }
      return;
    }
    // desktop
    this.searchBarHandlerService.openOverlayState$.next(null);
    this.searchBarHandlerService.flowSuggestion$.next(
      RecommendationFlow.CALENDAR
    );
  }

  searchAlternativeOption(): void {
    const queryParams = {
      ...this.route.snapshot.queryParams,
      [RouteKeyQueryParams.promoCode]: null
    };
    this.bookingTransactionService.promoCode$.next(null);
    this.bookingTransactionService.clearPromoCode$.next(true);
    this.appRouterService.updateRouteQueryParams(queryParams, {
      done: () =>
        this.suggestionHandlerService.loadAvailableStayOptions(
          ELoadingStatus.reloading
        )
    });
  }

  selectSpaceType(spaceTypeCode: string): void {
    let selected = this.selectedSpaceType();
    const isSelectedBefore = selected === spaceTypeCode;
    this.selectedSpaceType.set(isSelectedBefore ? null : spaceTypeCode);
    const travelerSelected =
      this.bookingTransactionService.travelerSelected$.value;
    const dateSelected = this.bookingTransactionService.dateSelected$.value;
    const promoCode = this.bookingTransactionService.promoCode$?.value;
    const featureParam = this.configuratorService.featureParam();
    this.appRouterService.updateRouteQueryParams(
      {
        ...this.route.snapshot.queryParams,
        [RouteKeyQueryParams.spaceTypes]: this.selectedSpaceType(),
        [RouteKeyQueryParams.numberOfRoom]: travelerSelected || null,
        [RouteKeyQueryParams.checkInDate]: dateSelected?.from || null,
        [RouteKeyQueryParams.checkOutDate]: dateSelected?.to || null,
        [RouteKeyQueryParams.promoCode]: promoCode || null,
        [RouteKeyQueryParams.customizeStay]: featureParam || null
      },
      {
        done: () =>
          this.suggestionHandlerService.loadAvailableStayOptions(
            ELoadingStatus.reloading
          )
      }
    );
  }
}
