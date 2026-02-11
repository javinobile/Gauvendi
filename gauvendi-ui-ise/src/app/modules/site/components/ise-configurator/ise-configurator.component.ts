import { A11yModule } from '@angular/cdk/a11y';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnChanges,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router } from '@angular/router';
import { ELoadingStatus } from '@app/models/loading-status.model';
import { IseConfiguratorModule } from '@app/modules/site/pages/recommendation/directives/ise-configurator/ise-configurator.module';
import { FilterRetailFeatureSelectedPipe } from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/filter-retail-feature-selected.pipe';
import { FeatureByCategoryCodePipe } from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/get-retail-feature-by-code.pipe';
import { CategoryHoveringMsgPipe } from '@app/modules/site/pages/recommendation/pipes/category-hovering-msg.pipe';
import { AccessibilityService } from '@app/services/accessibility.service';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { CartService } from '@app/services/cart.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { TrackingService } from '@app/services/tracking.service';
import { ImageHoveringComponent } from '@app/shared/components/image-hovering/image-hovering.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { FeatureDescriptionTooltipDirective } from '@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MultiLangEnum } from '@app/store/multi-lang/multi-lang.state';
import { selectorStayOptionSuggestionListStatus } from '@app/store/suggestion/suggestion.selectors';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  HotelRetailCategory,
  HotelRetailFeature,
  WidgetEventFeatureRecommendation
} from '@core/graphql/generated/graphql';
import { select, Store } from '@ngrx/store';
import { parse, subDays } from 'date-fns';
import { combineLatest, distinctUntilChanged, noop } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { OrderBySelectedFeaturesPipe } from './pipes/order-by-selected-features.pipe';

@Component({
  selector: 'app-ise-configurator',
  standalone: true,
  imports: [
    CommonModule,
    IseConfiguratorModule,
    FilterSvgDirective,
    FilterRetailFeatureSelectedPipe,
    TranslatePipe,
    CustomTooltipModule,
    FeatureByCategoryCodePipe,
    FeatureDescriptionTooltipDirective,
    ImageHoveringComponent,
    CategoryHoveringMsgPipe,
    MatIconModule,
    MatTooltipModule,
    OrderBySelectedFeaturesPipe,
    A11yModule
  ],
  templateUrl: './ise-configurator.component.html',
  styleUrls: ['./ise-configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IseConfiguratorComponent
  extends DirSettingDirective
  implements OnInit, OnChanges
{
  private suggestionHandlerService = inject(SuggestionHandlerService);
  private appRouterService = inject(AppRouterService);
  private bookingTransactionService = inject(BookingTransactionService);
  private hotelConfigService = inject(HotelConfigService);
  private trackingService = inject(TrackingService);
  private cartService = inject(CartService);
  private store = inject(Store);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private accessibilityService = inject(AccessibilityService);

  hotelRetailCategoryList = input<HotelRetailCategory[]>([]);
  hotelRetailFeatureList = input<HotelRetailFeature[]>([]);
  eventFeatureRecommendationList = input<WidgetEventFeatureRecommendation>();
  @ViewChild('elementFeature', { static: false }) elementFeatureRef: ElementRef;
  configuratorService = inject(ConfiguratorService);
  categorySelected = this.configuratorService.categorySelected;
  featureSelected = signal<string[]>([]);
  suggestSelected = signal<string[]>([]);
  hotelSuggestedFeatureCodeList = computed(() => {
    return this.eventFeatureRecommendationList()?.popularRetailFeatureList?.map(
      (x) => x?.code
    );
  });

  isCollapse = this.configuratorService.isCollapse;

  buttonTextColor$ = this.hotelConfigService.buttonTextColor$;
  hotelPrimaryColor$ = this.hotelConfigService.buttonBgColor$;
  categoryHoverText$ = this.hotelConfigService.categoryHoverText$;
  categoryHoverBg$ = this.hotelConfigService.categoryHoverBg$;
  categoryDefaultText$ = this.hotelConfigService.categoryDefaultText$;
  categoryDefaultBg$ = this.hotelConfigService.categoryDefaultBg$;
  featureDefaultIcon$ = this.hotelConfigService.featureSelectedText$;
  featureHoverIcon$ = this.hotelConfigService.featureHoverText$;
  colorText$ = this.hotelConfigService.colorText$;

  isNext = signal(false);
  featureRankings = computed(() => {
    const featureSelected = this.featureSelected()?.map((x) =>
      this.hotelRetailFeatureList()?.find((a) => a?.code === x)
    );
    const arr = featureSelected?.reduce((acc, item) => {
      const category = item?.hotelRetailCategory?.code;

      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
    return Object.keys(arr)?.map((x) => ({
      category: this.hotelRetailCategoryList()?.find(
        (cate) => cate?.code === x
      ),
      features: arr[x] as HotelRetailFeature[]
    }));
  });
  curFeatureRankings = computed(() => this.featureRankings());

  suggestedCategorys = computed(() =>
    this.eventFeatureRecommendationList()?.popularRetailFeatureList?.map(
      (feat) => feat?.code?.split('_')?.[0]
    )
  );

  @ViewChild('featureSelectedEl', { static: false })
  scrollContainerEl: ElementRef;

  readonly isOverflowing = signal(false);
  readonly scrollFeatureDirection = signal<'LEFT' | 'RIGHT'>('RIGHT');

  stayOptionSuggestionStatus$ = this.store.pipe(
    select(selectorStayOptionSuggestionListStatus)
  );

  readonly ELoadingStatus = ELoadingStatus;

  loadWidgetRecommendation$ = combineLatest([
    this.bookingTransactionService.dateSelected$,
    this.bookingTransactionService.travelerSelected$,
    this.route.queryParams.pipe(
      map((queries) => queries[RouteKeyQueryParams.lang])
    )
  ]).pipe(
    distinctUntilChanged(
      (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
    ),
    tap(([dateSelected, travelerSelected, locale]) => {
      const checkInDate = dateSelected?.from;
      const checkOutDate = dateSelected?.to;
      if (!checkInDate || !checkOutDate) return;
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
  allowDisplayView = signal(true);

  constructor() {
    super();
    effect(
      () => {
        if (!this.categorySelected() && !this.isCollapse()) {
          this.selectCategory(this.hotelRetailCategoryList()?.[0]);
        }
        if (this.featureSelected()?.length > 0) {
          setTimeout(() => this.checkOverflow(), 100);
        }
        if (!this.isCollapse()) {
          setTimeout(() => {
            this.accessibilityService.monitorFocus(
              this.elementFeatureRef?.nativeElement,
              '.configurator-category-selected'
            );
          }, 100);
        } else {
          this.accessibilityService.stopMonitorFocus(
            this.elementFeatureRef?.nativeElement
          );
        }
      },
      { allowSignalWrites: true }
    );
  }

  updateCartFeatures(): void {
    const queryParams = this.route.snapshot.queryParams;
    const tab = this.cartService.getActiveTab(queryParams);
    this.cartService.setCartByIdx(tab, {
      ...this.cartService.getCartByIdx(tab),
      selectedFeatures: this.featureSelected()
    });
  }

  removeSelectedFeat(featCode: string): void {
    // Remove feature from selected features list
    const newFeatureList = this.featureSelected().filter(
      (item) => item !== featCode
    );
    this.featureSelected.set(newFeatureList);
    this.configuratorService.featureSelected.set(newFeatureList);

    // Remove from suggested features if present
    if (this.suggestSelected()?.includes(featCode)) {
      const newSuggestions = this.suggestSelected().filter(
        (item) => item !== featCode
      );
      this.suggestSelected.set(newSuggestions);
    }

    // Update feature parameters
    if (newFeatureList.length === 0) {
      this.resetFeatureParams();
    } else {
      this.updateFeatureParams();
    }

    this.updateCartFeatures();
  }

  private resetFeatureParams(): void {
    this.configuratorService.featureParam.set(null);
    this.configuratorService.minimalView.set(false);
  }

  private updateFeatureParams(): void {
    const featureParam = this.curFeatureRankings()
      ?.map(
        (x) =>
          `${x?.category?.code}-${x?.features?.map((f) => f?.code)?.join('-')}`
      )
      ?.reduce((arr, cur) => arr.concat(cur), [])
      ?.join(',');
    this.configuratorService.featureParam.set(featureParam);
  }

  removeAllSelectedFeat(): void {
    this.featureSelected.set([]);
    this.configuratorService.featureSelected.set([]);
    this.suggestSelected.set([]);
    this.resetFeatureParams();

    this.updateCartFeatures();

    // Update route query params to remove customizeStay parameter and reload stay options
    this.appRouterService.updateRouteQueryParams(
      {
        [RouteKeyQueryParams.customizeStay]: null
      },
      {
        done: () => {
          this.suggestionHandlerService.loadAvailableStayOptions();
        }
      }
    );
  }

  ngOnInit() {
    this.route.queryParams
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((queryParam) => ({
          features: queryParam[RouteKeyQueryParams.customizeStay],
          isCustomized: queryParam[RouteKeyQueryParams.customize]
        })),
        distinctUntilChanged(
          (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
        ),
        tap(({ features, isCustomized }) => {
          if (isCustomized) {
            const featureList = features
              ?.split(',')
              ?.flatMap((item) => {
                const fragments = item?.split('-');
                if (!fragments?.length || fragments.length < 2) {
                  return [];
                }
                if (fragments?.length === 2) {
                  return [fragments[1]];
                }
                return fragments?.slice(1);
              })
              ?.filter((item) => !!item);
            this.featureSelected.set([
              ...(featureList?.length > 0 ? featureList : [])
            ]);
            this.configuratorService.featureSelected.set(
              this.featureSelected()
            );
            this.configuratorService.featureParam.set(features);
          }
        })
      )
      .subscribe();

    this.handleDisplayView();
  }

  ngOnChanges() {
    this.isNext.set(false);
  }

  selectCategory(category: HotelRetailCategory, selector?: string) {
    this.configuratorService.isCollapse.set(false);
    this.categorySelected.set(category);

    if (!selector) return;
    setTimeout(() => {
      this.accessibilityService.focusOnElement(
        this.elementFeatureRef?.nativeElement
      );

      this.accessibilityService.handleExitFocusTrap(selector);
    }, 100);
  }

  handleDisplayView() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.allowDisplayView.set(
          event.url?.includes(RouterPageKey.recommendation)
        );
      });
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(
      this.curFeatureRankings(),
      event.previousIndex,
      event.currentIndex
    );
    this.featureSelected.set([
      ...this.curFeatureRankings()
        ?.map((x) => x?.features?.map((x) => x?.code))
        ?.reduce((a, b) => a.concat(b), [])
    ]);
    const rankObj = {};
    const rankNames = this.curFeatureRankings()
      ?.filter((x) => x?.category)
      ?.map((x) => x?.category?.name);
    rankNames.forEach((item, idx) => {
      rankObj[`Rank ${idx + 1}`] = item;
    });

    this.trackingService.track(MixpanelKeys.ChangeRank, {
      name: 'Configurator',
      ...rankObj
    });
  }

  nextFeature(categoryEle: HTMLElement) {
    this.direction() === 'ltr'
      ? categoryEle.scrollBy({
          left: this.isNext() ? -500 : 500,
          behavior: 'smooth'
        })
      : categoryEle.scrollBy({
          left: this.isNext() ? 500 : -500,
          behavior: 'smooth'
        });
    this.isNext.set(!this.isNext());
  }

  async checkOverflow(): Promise<void> {
    const el = this.scrollContainerEl?.nativeElement as HTMLElement;
    if (el) {
      const isOverflowed = el.scrollWidth > el.clientWidth;
      this.isOverflowing.set(isOverflowed);
    }
  }

  scrollFeature(scrollContainerEl: HTMLElement): void {
    this.direction() === 'ltr'
      ? scrollContainerEl.scrollBy({
          left: this.scrollFeatureDirection() === 'RIGHT' ? -500 : 500,
          behavior: 'smooth'
        })
      : scrollContainerEl.scrollBy({
          left: this.scrollFeatureDirection() === 'RIGHT' ? 500 : -500,
          behavior: 'smooth'
        });
    this.scrollFeatureDirection.set(
      this.scrollFeatureDirection() === 'RIGHT' ? 'LEFT' : 'RIGHT'
    );
  }

  handleFeature(code: string) {
    if (this.configuratorService.minimalView()) {
      this.configuratorService.minimalView.set(false);
    }
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
    this.updateFeatureParams();
    this.configuratorService.featureSelected.set(this.featureSelected());
    this.updateCartFeatures();

    document.getElementById('search-btn')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }

  addSuggestFeature(code: string) {
    const index = this.suggestSelected()?.findIndex((x) => x === code);
    const categoryCode = this.hotelRetailFeatureList()?.find(
      (x) => x?.code === code
    )?.hotelRetailCategory?.code;
    const category = this.hotelRetailCategoryList()?.find(
      (x) => x?.code === categoryCode
    );
    this.suggestSelected.update((values) =>
      index < 0 ? [...values, code] : values?.filter((x) => x !== code)
    );
    this.configuratorService.isCollapse.set(false);
    this.handleFeature(code);
    this.selectCategory(category);
    this.scrollToTargetElement(code);
  }

  clear() {
    this.featureSelected.set([]);
    this.suggestSelected.set([]);
    this.configuratorService.featureParam.set(null);
    this.configuratorService.featureSelected.set([]);
  }

  scrollToTargetElement(
    targetId: string,
    timeout?: number,
    block: ScrollLogicalPosition = 'center'
  ) {
    setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: 'smooth',
        block,
        inline: 'nearest'
      });
    }, timeout || 0);
  }

  expandConfig(b: HotelRetailFeature[]) {
    const categoryCode = b?.[0]?.hotelRetailCategory?.code;
    const code = b?.[0]?.code;
    const category = this.hotelRetailCategoryList()?.find(
      (x) => x?.code === categoryCode
    );
    this.configuratorService.isCollapse.set(false);
    this.selectCategory(category);
    this.scrollToTargetElement(code);
  }

  expandConfigurator(): void {
    this.configuratorService.minimalView.set(false);
    this.isCollapse.set(false);
  }
}
