import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { ConfiguratorManagementMobileComponent } from '@app/modules/site/components/configurator-management-mobile/configurator-management-mobile.component';
import { OverlayMobileDirective } from '@app/modules/site/directives/overlay-mobile.directive';
import { IseConfiguratorModule } from '@app/modules/site/pages/recommendation/directives/ise-configurator/ise-configurator.module';
import { FilterRetailFeatureSelectedPipe } from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/filter-retail-feature-selected.pipe';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { CommonService } from '@app/services/common.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { TrackingService } from '@app/services/tracking.service';
import { ImageHoveringComponent } from '@app/shared/components/image-hovering/image-hovering.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MultiLangEnum } from '@app/store/multi-lang/multi-lang.state';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  HotelRetailCategory,
  HotelRetailFeature,
  WidgetEventFeatureRecommendation
} from '@core/graphql/generated/graphql';
import { parse, subDays } from 'date-fns';
import { combineLatest, distinctUntilChanged, noop } from 'rxjs';
import { debounceTime, filter, map, tap } from 'rxjs/operators';
import SwiperCore, {
  Navigation,
  Pagination,
  Swiper,
  SwiperOptions
} from 'swiper';
import { SwiperModule } from 'swiper/angular';
import { OrderBySelectedFeaturesPipe } from '../ise-configurator/pipes/order-by-selected-features.pipe';

SwiperCore.use([Navigation, Pagination]);

@Component({
  selector: 'app-ise-configurator-mobile',
  standalone: true,
  imports: [
    CommonModule,
    FilterRetailFeatureSelectedPipe,
    FilterSvgDirective,
    IseConfiguratorModule,
    TranslatePipe,
    MatIconModule,
    OverlayMobileDirective,
    CustomTooltipModule,
    ImageHoveringComponent,
    SwiperModule
  ],
  templateUrl: './ise-configurator-mobile.component.html',
  styleUrls: ['./ise-configurator-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class IseConfiguratorMobileComponent
  extends DirSettingDirective
  implements OnInit
{
  private hotelConfigService = inject(HotelConfigService);
  private configuratorService = inject(ConfiguratorService);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private bookingTransactionService = inject(BookingTransactionService);
  private suggestionHandlerService = inject(SuggestionHandlerService);
  private router = inject(Router);
  private commonService = inject(CommonService);

  @ViewChild('featureSelectedEl', { static: false })
  scrollContainerEl: ElementRef;

  @ViewChild('swiper') swiper?: { swiperRef: Swiper };

  swiperConfig: SwiperOptions = {
    slidesPerView: 'auto',
    spaceBetween: 8,
    freeMode: true,
    touchEventsTarget: 'container',
    resistance: true,
    resistanceRatio: 0.85,
    watchOverflow: true,
    observer: true,
    observeParents: true,
    updateOnWindowResize: true,
    navigation: {
      nextEl: '.slider__next',
      prevEl: '.slider__prev'
    }
  };

  allowDisplayView = true;
  isFirstSlide = signal(true);
  readonly isOverflowing = signal(false);
  readonly scrollFeatureDirection = signal<'LEFT' | 'RIGHT'>('RIGHT');

  hotelRetailCategoryList = input<HotelRetailCategory[]>();
  hotelRetailFeatureList = input<HotelRetailFeature[]>();
  eventFeatureRecommendationList = input<WidgetEventFeatureRecommendation>();
  featureSelected = this.configuratorService.featureSelected;
  featureSelected$ = toObservable(this.featureSelected);
  featureRankings = computed(() => {
    const arr = this.configuratorService
      .featureParam()
      ?.split(',')
      .filter((x) => x.trim() !== '');
    arr?.map((x) => {
      const categoryCode = x?.split('-')?.[0];
      return {
        category: this.hotelRetailCategoryList()?.find(
          (cate) => cate?.code === categoryCode
        ),
        features: this.hotelRetailFeatureList()?.filter((re) =>
          x?.split('-')?.includes(re?.code)
        )
      };
    });
    return arr?.map((x) => {
      const categoryCode = x?.split('-')?.[0];
      return {
        category: this.hotelRetailCategoryList()?.find(
          (cate) => cate?.code === categoryCode
        ),
        features: this.hotelRetailFeatureList()?.filter((re) =>
          x?.split('-')?.includes(re?.code)
        )
      };
    });
  });
  popUpComponent = ConfiguratorManagementMobileComponent;
  trackingService = inject(TrackingService);
  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;
  isNext = signal(false);
  categoryDefaultText$ = this.hotelConfigService.categoryDefaultText$;
  categoryDefaultBg$ = this.hotelConfigService.categoryDefaultBg$;
  featureDefaultIcon$ = this.hotelConfigService.featureSelectedText$;
  featureHoverIcon$ = this.hotelConfigService.featureHoverText$;
  buttonTextColor$ = this.hotelConfigService.buttonTextColor$;
  isDirectLink = this.commonService.isDirectLink;

  handleDisplayView() {
    // Initial check
    this.checkAndUpdateDisplayView();

    // Subscribe to navigation events
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.checkAndUpdateDisplayView();
      });
  }

  async checkOverflow(): Promise<void> {
    await this.cd.detectChanges();
    const swiperInstance = this.swiper?.swiperRef;

    if (swiperInstance) {
      const isOverflowed = swiperInstance.isBeginning !== swiperInstance.isEnd;
      this.isOverflowing.set(isOverflowed);
      this.scrollFeatureDirection.set(swiperInstance.isEnd ? 'LEFT' : 'RIGHT');
      this.cd.detectChanges();
    }
  }

  onSlideChange(event): void {
    this.isFirstSlide.set(event?.activeIndex === 0);
    this.cd.detectChanges();
  }

  private checkAndUpdateDisplayView() {
    const currentUrl = this.router.url;
    this.allowDisplayView = currentUrl.includes(RouterPageKey.recommendation);
    this.cd.detectChanges();
  }

  /** This code will match with ise-configurator.component.ts */
  readonly loadWidgetRecommendation$ = combineLatest([
    this.bookingTransactionService.dateSelected$,
    this.bookingTransactionService.travelerSelected$,
    this.route.queryParams.pipe(
      map((queries) => queries[RouteKeyQueryParams.lang])
    )
  ]).pipe(
    distinctUntilChanged(
      (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
    ),
    filter((e) => e.every((x) => x !== null && x !== undefined)),
    tap(([dateSelected, travelerSelected, locale]) => {
      const checkInDate = dateSelected?.from;
      const checkOutDate = dateSelected?.to;
      if (!checkInDate || !checkOutDate || !travelerSelected) return;

      const fromDate = this.bookingTransactionService
        .convertDateToISOFormat(parse(checkInDate, 'dd-MM-yyyy', new Date()))
        .split('T')[0];
      const toDate = this.bookingTransactionService
        .convertDateToISOFormat(
          subDays(parse(checkOutDate, 'dd-MM-yyyy', new Date()), 1)
        )
        .split('T')[0];

      const queryParams = this.route.snapshot.queryParams;
      const translateTo =
        locale === MultiLangEnum.EN ? null : locale?.toLocaleUpperCase();

      const filter = {
        fromDate,
        toDate,
        propertyCode: this.bookingTransactionService.getHotelCode(queryParams),
        promoCode: this.bookingTransactionService.getPromoCode(queryParams),
        roomRequestList:
          this.bookingTransactionService.getRoomRequestListFromString(
            travelerSelected
          ),
        translateTo
      };
      this.suggestionHandlerService.loadWidgetEventFeatureRecommendationList(
        filter
      );
    })
  );

  constructor() {
    super();
  }

  ngOnInit() {
    this.route.queryParams
      .pipe(
        map((params) => params[RouteKeyQueryParams.customizeStay]),
        distinctUntilChanged(
          (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((val) => {
        const categories = val?.split(',');
        if (categories?.length > 0) {
          const currentRetailParams = [
            ...categories.reduce((p, c) => {
              const temp = c.split('-');
              if (temp?.length > 2) {
                temp.splice(0, 1);
                return p?.concat(temp);
              }
              return p?.concat(temp[1]);
            }, [])
          ];
          this.featureSelected.set([...currentRetailParams]);
          this.configuratorService.featureParam.set(
            currentRetailParams.join(',')
          );
          this.configuratorService.featureSelected.set([
            ...currentRetailParams
          ]);
        } else {
          this.configuratorService.featureParam.set(null);
          this.featureSelected.set([]);
          this.configuratorService.featureSelected.set([]);
        }
      });

    this.handleDisplayView();

    this.featureSelected$
      .pipe(
        // takeUntilDestroyed(this.destroyRef)
        debounceTime(100)
      )
      .subscribe(() => {
        this.checkOverflow();
      });
  }

  selectCategory(cFeature?: HotelRetailCategory) {
    if (cFeature) {
      this.configuratorService.categorySelected.set(cFeature);
      return;
    }

    const orderedCategory = new OrderBySelectedFeaturesPipe().transform(
      this.hotelRetailCategoryList(),
      this.featureSelected()
    );

    this.configuratorService.categorySelected.set(orderedCategory?.[0]);
  }

  handleFeature(code: string) {
    const index = this.featureSelected()?.findIndex((x) => x === code);
    this.featureSelected.update((values) =>
      index < 0 ? [...values, code] : values?.filter((x) => x !== code)
    );
    const feature = this.hotelRetailFeatureList()?.find(
      (x) => x?.code === code
    );
    !this.featureSelected()?.includes(code)
      ? this.trackingService.track(MixpanelKeys.SelectFeature, {
          name: 'Configurator',
          category_code: feature?.hotelRetailCategory?.code,
          feature_code: feature?.code
        })
      : noop();

    this.configuratorService.featureSelected.set([...this.featureSelected()]);
  }

  addSuggestFeature(code: string) {
    const categoryCode = this.hotelRetailFeatureList()?.find(
      (x) => x?.code === code
    )?.hotelRetailCategory?.code;
    const category = this.hotelRetailCategoryList()?.find(
      (x) => x?.code === categoryCode
    );
    this.handleFeature(code);
    this.selectCategory(category);
  }

  removeSelectedFeat(featCode: string) {
    // Remove feature from selected features list
    const newFeatureList = this.featureSelected().filter(
      (item) => item !== featCode
    );
    this.featureSelected.set(newFeatureList);
    this.configuratorService.featureSelected.set(newFeatureList);

    // Update feature parameters
    if (newFeatureList.length === 0) {
      this.configuratorService.featureParam.set('');
      this.featureSelected.set([]);
      this.configuratorService.featureSelected.set([]);
    } else {
      this.updateFeatureParams();
    }

    this.bookingTransactionService.updateQueryParams(() => {
      this.suggestionHandlerService.loadAvailableStayOptions();
    });
  }

  private updateFeatureParams(): void {
    const featureParam = this.featureRankings()
      ?.map(
        (x) =>
          `${x?.category?.code}-${x?.features?.map((f) => f?.code)?.join('-')}`
      )
      ?.reduce((arr, cur) => arr.concat(cur), [])
      ?.join(',');
    this.configuratorService.featureParam.set(featureParam);
  }
}
