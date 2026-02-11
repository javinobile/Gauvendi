import { AsyncPipe, CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { IRoomSummary } from '@app/models/common.model';
import { CombinationOptionItemComponent } from '@app/modules/site/pages/recommendation/components/combination-option-item/combination-option-item.component';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { IseLoadingComponent } from '@app/shared/components/ise-loading/ise-loading.component';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  selectorCurrencyCodeSelected,
  selectorRoomsStayOptionDetails
} from '@app/state-management/router.selectors';
import { Scroller } from '@app/utils/scroller.util';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  BookingFlow,
  BookingPricing,
  HotelAmenity,
  HotelTaxSettingEnum,
  RatePlan
} from '@core/graphql/generated/graphql';
import { EDisplayMode } from '@models/display-mode.model';
import { ELoadingStatus } from '@models/loading-status.model';
import { EPriceView, ICombinationOptionItem } from '@models/option-item.model';
import { select, Store } from '@ngrx/store';
import {
  selectorHotelRate,
  selectorIsInclusive,
  selectorLowestPriceImageUrl,
  selectorLowestPriceOpaque,
  selectorTravelProfile
} from '@store/hotel/hotel.selectors';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import {
  loadCalculateBookingPricing,
  loadHotelAmenityIncluded,
  loadSearchMatchingRfc,
  loadSurchargeAmenityList
} from '@store/pick-extras/pick-extras.actions';
import {
  selectorCalculateBookingPricing,
  selectorHotelAmenityIncluded,
  selectorRooms,
  selectorSearchMatchingRfc,
  selectorSearchMatchingRfcStatus,
  selectorSurchargeAmenityList
} from '@store/pick-extras/pick-extras.selectors';
import { loadAvailableAmenity } from '@store/suggestion/suggestion.actions';
import {
  selectorAvailableAmenity,
  selectorAvailableAmenityStatus,
  selectorAvailableMealPlan,
  selectorAvailableServices,
  selectorHotelAvailableAmenitiesStatus,
  selectorRatePlanList
} from '@store/suggestion/suggestion.selectors';
import * as moment from 'moment/moment';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  skipWhile,
  Subject,
  switchMap,
  tap
} from 'rxjs';
import { debounceTime, first, shareReplay } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { CombinationOptionItemMobileComponent } from '../recommendation/components/combination-option-item-mobile/combination-option-item-mobile.component';
import { OptionItemDetailComponent } from '../recommendation/components/option-item-detail/option-item-detail.component';
import { OptionItemComponent } from '../recommendation/components/option-item/option-item.component';
import { OptionUtil } from '../recommendation/utils/option.util';
import { ExtraServiceListLoadingComponent } from './components/extra-service-list-loading/extra-service-list-loading.component';
import { ExtrasServiceListComponent } from './components/extras-service-list/extras-service-list.component';
import { RoomDetailLoadingComponent } from './components/room-detail-loading/room-detail-loading.component';
import { TotalPriceSectionComponent } from './components/total-price-section/total-price-section.component';
import { GetReservationPricingByIndexPipe } from './pipes/get-reservation-pricing-by-index.pipe';
@Component({
  selector: 'app-pick-extras',
  standalone: true,
  imports: [
    CombinationOptionItemComponent,
    CombinationOptionItemMobileComponent,
    CommonModule,
    ExtraServiceListLoadingComponent,
    ExtrasServiceListComponent,
    GetReservationPricingByIndexPipe,
    IseLoadingComponent,
    MatIconModule,
    MatTabsModule,
    OptionItemComponent,
    OptionItemDetailComponent,
    RoomDetailLoadingComponent,
    TranslatePipe,
    TotalPriceSectionComponent,
    BreadcrumbComponent,
    AsyncPipe
  ],
  templateUrl: './pick-extras.component.html',
  styleUrls: ['./pick-extras.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AsyncPipe]
})
export class PickExtrasComponent implements OnInit, OnDestroy {
  private readonly commonService = inject(CommonService);
  private readonly bookingTransactionService = inject(
    BookingTransactionService
  );
  private readonly configService = inject(HotelConfigService);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly suggestionHandlerService = inject(SuggestionHandlerService);
  private appRouterService = inject(AppRouterService);
  private asyncPipe = inject(AsyncPipe);

  protected readonly ELoadingStatus = ELoadingStatus;
  roomIdxView = 0;
  priceState: EPriceView;
  isLowestPriceOption$ = this.store.pipe(
    select(selectorRoomsStayOptionDetails),
    map((data) => data?.find((x) => x === BookingFlow.LowestPrice))
  );
  searchMatchingRfc$: Observable<ICombinationOptionItem> = this.store.pipe(
    select(selectorSearchMatchingRfc),
    filter((rfcs) => !!rfcs),
    switchMap((rfcs) =>
      this.store.pipe(
        select(selectorRoomsStayOptionDetails),
        map((stayOptionCodes) =>
          OptionUtil.mappingMatchingOptionItem(rfcs, stayOptionCodes)
        )
      )
    ),
    debounceTime(300)
  );
  searchMatchingRfcStatus$ = this.store.pipe(
    select(selectorSearchMatchingRfcStatus)
  );
  scroll$ = this.searchMatchingRfc$.pipe(
    first(),
    tap((data) => {
      if (!data) return;

      this.scrollToExtrasList();
    })
  );

  priceState$: Observable<EPriceView> = this.route.queryParams.pipe(
    map(() => EPriceView.PerNight)
  );
  currencyRate$: Observable<number> = this.store.pipe(
    select(selectorHotelRate)
  );
  isIncludedTax$ = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );
  currencyCode$: Observable<string> = this.store.pipe(
    select(selectorCurrencyCodeSelected)
  );
  isLowestPriceOpaque$ = this.store.pipe(select(selectorLowestPriceOpaque));
  lowestPriceImageUrl$ = this.store.select(selectorLowestPriceImageUrl);
  roomSummary$ = this.commonService.roomSummary$;
  salesPlanList$ = this.store.pipe(
    select(selectorRatePlanList),
    tap((data) => {
      this.handleChangeRoomServices(data);
    })
  );

  roomsDetails$ = combineLatest([
    this.store.pipe(
      skipWhile((data) => !data),
      select(selectorRooms),
      distinctUntilChanged(
        (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
      )
    ),
    this.route.queryParams.pipe(
      map((queryParams) => queryParams[RouteKeyQueryParams.lang]),
      distinctUntilChanged()
    )
  ]).pipe(
    tap(([roomDetail]) => {
      if (roomDetail) {
        const queryParams = this.route.snapshot.queryParams;
        const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
        const arrival = this.bookingTransactionService.getArrival(queryParams);
        const departure =
          this.bookingTransactionService.getDeparture(queryParams);
        const arrivalDateTime =
          this.bookingTransactionService.convertDateToISOFormat(
            new Date(arrival)
          );
        const departureDateTime =
          this.bookingTransactionService.convertDateToISOFormat(
            new Date(departure)
          );
        const roomRequestList =
          this.bookingTransactionService.getRoomRequestList(queryParams);
        const locale = queryParams[RouteKeyQueryParams.lang];
        const bookingFlow = queryParams[RouteKeyQueryParams.bookingFlow];
        const ratePlanCode = queryParams[RouteKeyQueryParams.ratePlanCode];
        const promoCode =
          this.bookingTransactionService.getPromoCode(queryParams);

        this.suggestionHandlerService.loadWidgetEventFeatureRecommendationList();

        this.store.dispatch(
          loadSearchMatchingRfc({
            variables: roomDetail?.map((_item, index) => {
              const rfcCode =
                queryParams[RouteKeyQueryParams.rfcCodes]?.split('~')?.[index];
              const priorityCategoryCodeList =
                this.bookingTransactionService.getPriorityCurrentRoomConfiguration(
                  queryParams
                ) || null;
              return {
                filter: {
                  hotelCode,
                  arrival: arrivalDateTime,
                  departure: departureDateTime,
                  roomRequestList: [roomRequestList[index]],
                  priorityCategoryCodeList,
                  rfcCode,
                  ratePlanCode,
                  translateTo:
                    locale === MultiLangEnum.EN
                      ? null
                      : locale?.toLocaleUpperCase(),
                  promoCodeList: promoCode ? [promoCode] : null,
                  bookingFlow
                }
              };
            })
          })
        );
      }
    })
  );

  hotelAvailableAmenity$: Observable<HotelAmenity[]> = this.store.pipe(
    select(selectorAvailableAmenity)
  );
  hotelAvailableMealPlan$: Observable<HotelAmenity[]> = this.store.pipe(
    select(selectorAvailableMealPlan)
  );
  hotelAvailableServices$: Observable<HotelAmenity[]> = this.store.pipe(
    select(selectorAvailableServices)
  );
  hotelAmenityIncluded$: Observable<HotelAmenity[]> = this.store.pipe(
    select(selectorHotelAmenityIncluded)
  );
  hotelAmenityLoading$: Observable<boolean> = this.store.pipe(
    select(selectorHotelAvailableAmenitiesStatus),
    map((status) => status === ELoadingStatus.loading)
  );
  isMatchFlow$: Observable<boolean> = this.route.queryParams.pipe(
    map((params) => +params[RouteKeyQueryParams.customize] === 1)
  );
  destroyed$ = new Subject();
  hotelInclusive$ = this.store.pipe(select(selectorIsInclusive));
  pricing$: Observable<BookingPricing> = this.store.pipe(
    select(selectorCalculateBookingPricing),
    shareReplay()
  );

  travelProfile$ = this.store.pipe(
    select(selectorTravelProfile),
    distinctUntilChanged()
  );

  protected readonly EDisplayMode = EDisplayMode;
  protected readonly EPriceView = EPriceView;
  breadcrumb = [
    {
      name: 'ENHANCE_YOUR_STAY',
      isSelected: true,
      url: null
    }
  ];
  roomUUIDList: string[] = [];

  active$ = this.route.queryParams.pipe(
    map((queryParams) => queryParams[RouteKeyQueryParams.active]),
    distinctUntilChanged(),
    map((activeIdx) => (!activeIdx ? 0 : activeIdx)),
    map((activeIdx) => +activeIdx + 1)
  );

  roomSummaryList: IRoomSummary[] =
    this.bookingTransactionService
      .getRoomRequestList(this.route.snapshot.queryParams)
      ?.map((item) => ({
        adults: item.adult,
        children: item.childrenAgeList.length,
        pets: item.pets
      })) || [];
  surchargeAmenityList$: Observable<HotelAmenity[]> = this.store.pipe(
    select(selectorSurchargeAmenityList)
  );

  constructor() {}

  ngOnInit(): void {
    this.roomUUIDList = this.route.snapshot.queryParams[
      RouteKeyQueryParams.roomPlans
    ]
      ?.split('~')
      .map((x) => {
        return uuidv4();
      });

    this.route.queryParams
      .pipe(
        map((params) => params[RouteKeyQueryParams.lang]),
        distinctUntilChanged()
      )
      .subscribe(() => {
        const status = this.asyncPipe.transform(
          this.store.select(selectorAvailableAmenityStatus)
        );
        if (status === ELoadingStatus.idle) {
          this.loadAvailableAmenity(this.route.snapshot.queryParams);
        }
        this.initData();
      });
    this.commonService.selectedRoomSummary.next(
      this.roomSummaryList?.[this.roomIdxView]
    );
  }

  ngOnDestroy(): void {
    this.commonService.selectedRoomSummary.next(null);
  }

  roomChange(roomIdx: number): void {
    this.roomIdxView = roomIdx;
    this.commonService.selectedRoomSummary.next(
      this.roomSummaryList?.[this.roomIdxView]
    );
    this.loadAvailableAmenity(this.route.snapshot.queryParams);
    this.initData();
    this.scrollToExtrasList();
  }

  initData(): void {
    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    const rfcRatePlanCode =
      queryParams[RouteKeyQueryParams.roomPlans]?.split('~')[this.roomIdxView];
    const rfcCode =
      queryParams[RouteKeyQueryParams.rfcCodes]?.split('~')[this.roomIdxView];
    const arrival = this.bookingTransactionService.getArrival(queryParams);
    const departure = this.bookingTransactionService.getDeparture(queryParams);

    this.store.dispatch(
      loadHotelAmenityIncluded({
        variables: {
          filter: {
            propertyCode: hotelCode,
            fromDate: moment(new Date(arrival))?.format('yyyy-MM-DD'),
            toDate: moment(new Date(departure))
              ?.subtract(1, 'days')
              ?.format('yyyy-MM-DD'),
            roomProductSalesPlanCode:
              rfcRatePlanCode?.length > 0 ? rfcRatePlanCode : null,
            roomRequest:
              this.bookingTransactionService.getRoomRequestList(queryParams)?.[
                this.roomIdxView
              ]
          }
        }
      })
    );

    this.store.dispatch(
      loadSurchargeAmenityList({
        variables: {
          filter: {
            hotelCode
          }
        }
      })
    );
    this.loadCalculatePaymentReservation();
    this.suggestionHandlerService.loadRatePlanList(rfcCode);
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
                index: this.roomUUIDList[index],
                adults: x?.adult,
                arrival: arrivalDateTime,
                departure: departureDateTime,
                childrenAgeList: x?.childrenAgeList,
                pets: x?.pets,
                amenityList: this.bookingTransactionService.getAmenityServices(
                  queryParams,
                  index
                ),
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

  loadAvailableAmenity(queryParams): void {
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
    const roomProductCode =
      queryParams[RouteKeyQueryParams.rfcCodes]?.split('~')[this.roomIdxView];
    this.store.dispatch(
      loadAvailableAmenity({
        variables: {
          filter: {
            hotelCode,
            fromTime,
            toTime,
            translateTo,
            salesPlanCode,
            roomProductCode,
            roomRequestList:
              this.bookingTransactionService.getRoomRequestList(queryParams)
          }
        }
      })
    );
  }

  onBack(): void {
    const queryParams = this.route.snapshot.queryParams;
    const prepareQueryParams = {
      [RouteKeyQueryParams.checkInDate]:
        queryParams[RouteKeyQueryParams.checkInDate],
      [RouteKeyQueryParams.checkOutDate]:
        queryParams[RouteKeyQueryParams.checkOutDate],
      [RouteKeyQueryParams.numberOfRoom]:
        queryParams[RouteKeyQueryParams.numberOfRoom],
      [RouteKeyQueryParams.lang]: queryParams[RouteKeyQueryParams.lang],
      [RouteKeyQueryParams.hotelCode]:
        queryParams[RouteKeyQueryParams.hotelCode],
      [RouteKeyQueryParams.currency]: queryParams[RouteKeyQueryParams.currency],
      [RouteKeyQueryParams.specificRoom]:
        queryParams[RouteKeyQueryParams.specificRoom],
      [RouteKeyQueryParams.promoCode]:
        queryParams[RouteKeyQueryParams.promoCode]
    };

    this.appRouterService.updateRouteQueryParams(prepareQueryParams, {
      navigateUrl: RouterPageKey.recommendation
    });
  }

  scrollToExtrasList() {
    const isMobile =
      /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    Scroller.scrollToTargetElement(
      'anchor',
      undefined,
      isMobile ? 'center' : 'start'
    );
  }

  handleChangeRoomServices(data: RatePlan[]): void {
    if (!data) return;

    const salesPlanCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.ratePlanCode];
    const roomServices =
      this.route.snapshot.queryParams[RouteKeyQueryParams.roomServices];

    const newRoomServices = roomServices?.split('~') || [];
    if (!newRoomServices?.length) return;

    let currentRoomServices = newRoomServices[this.roomIdxView];
    const mandatoryHotelExtrasList = data.find(
      (item) => item.code === salesPlanCode
    )?.mandatoryHotelExtrasList;

    if (!mandatoryHotelExtrasList?.length) return;

    for (const item of mandatoryHotelExtrasList) {
      if (currentRoomServices.includes(item.code)) {
        continue;
      }

      currentRoomServices += `,${item.code}`;
    }
    if (currentRoomServices === newRoomServices[this.roomIdxView]) {
      return;
    }

    newRoomServices[this.roomIdxView] = currentRoomServices;
    this.appRouterService.updateRouteQueryParams(
      {
        [RouteKeyQueryParams.roomServices]: newRoomServices.join('~')
      },
      {
        done: () => {
          this.loadCalculatePaymentReservation();
        }
      }
    );
  }
}
