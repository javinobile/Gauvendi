import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray
} from '@angular/cdk/drag-drop';
import { CdkScrollable, OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute } from '@angular/router';
import { FeatureRetailItemComponent } from '@app/modules/site/pages/recommendation/directives/ise-configurator/components/feature-retail-item/feature-retail-item.component';
import { FeatureCountConfiguratorPipe } from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/feature-count-configurator.pipe';
import { FeatureByCategoryCodePipe } from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/get-retail-feature-by-code.pipe';
import { GetSelectedFeaturePipe } from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/get-selected-feature.pipe';
import { ParseRankFeatureSelectedPipe } from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/parse-rank-feature-selected.pipe';
import { AppRouterService } from '@app/services/app-router.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { TrackingService } from '@app/services/tracking.service';
import { ImageHoveringComponent } from '@app/shared/components/image-hovering/image-hovering.component';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  HotelRetailCategory,
  HotelRetailFeature,
  HotelTag,
  WidgetEventFeatureRecommendation
} from '@core/graphql/generated/graphql';
import { select, Store } from '@ngrx/store';
import { selectorHotelTagList } from '@store/hotel-tag/hotel-tag.selectors';
import {
  selectorEventFeatureRecommendationList,
  selectorHotelRetailCategoryList,
  selectorHotelRetailFeatureList
} from '@store/hotel/hotel.selectors';
import { BehaviorSubject, noop, Observable, Subject, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SwiperOptions } from 'swiper';
import { SwiperComponent, SwiperModule } from 'swiper/angular';
import { OrderBySelectedFeaturesPipe } from '../ise-configurator/pipes/order-by-selected-features.pipe';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import SwiperCore, { Navigation, Pagination } from 'swiper';

SwiperCore.use([Navigation, Pagination]);

@Component({
  selector: 'app-configurator-management-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslatePipe,
    FeatureCountConfiguratorPipe,
    FilterSvgDirective,
    SwiperModule,
    MatProgressBarModule,
    FeatureRetailItemComponent,
    GetSelectedFeaturePipe,
    CdkScrollable,
    FeatureByCategoryCodePipe,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    ParseRankFeatureSelectedPipe,
    ImageHoveringComponent,
    OrderBySelectedFeaturesPipe
  ],
  templateUrl: './configurator-management-mobile.component.html',
  styleUrls: ['./configurator-management-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguratorManagementMobileComponent implements AfterViewInit {
  private readonly store = inject(Store);
  private readonly hotelConfigService = inject(HotelConfigService);
  private readonly configuratorService = inject(ConfiguratorService);
  private readonly route = inject(ActivatedRoute);
  private readonly appRouterService = inject(AppRouterService);
  private readonly bookingTransactionService = inject(BookingTransactionService);
  private readonly suggestionHandlerService = inject(SuggestionHandlerService);
  private readonly trackingService = inject(TrackingService);
  private readonly cd = inject(ChangeDetectorRef);

  @ViewChild('swiperComponent') swiperComponent: SwiperComponent;
  @ViewChild('element') element: ElementRef;

  config: SwiperOptions = {
    navigation: {
      nextEl: '.slider__next',
      prevEl: '.slider__prev'
    },
    pagination: false,
    slidesPerView: 'auto',
    spaceBetween: 8,
    loop: false
  };

  configMostPick: SwiperOptions = {
    navigation: false,
    pagination: false,
    spaceBetween: 8,
    loop: false,
    breakpoints: {
      0: {
        slidesPerView: 2
      },
      768: {
        slidesPerView: 4.3
      }
    }
  };

  progressCategoryValue = 0;
  progressMostPickValue = 0;
  sub: Subscription;
  isIOS = /iPhone|iPod|iPad/.test(navigator.userAgent);
  hotelRetailCategoryList = signal<HotelRetailCategory[]>([]);
  hotelRetailFeatureList = signal<HotelRetailFeature[]>([]);
  eventFeatureRecommendationList = signal<WidgetEventFeatureRecommendation>({});
  isFirstSlide = signal(true);
  hotelRetailCategoryList$ = this.store.pipe(
    select(selectorHotelRetailCategoryList),
    map((res) => {
      if (!res?.length) return [];

      return res?.filter((category) => category?.code !== 'SPT');
    }),
    tap((res) => {
      this.hotelRetailCategoryList.set(res);
    })
  );
  hotelRetailFeatureList$ = this.store.pipe(
    select(selectorHotelRetailFeatureList),
    tap((res) => {
      if (res) {
        this.hotelRetailFeatureList.set([...res]);
      }
    })
  );
  eventFeatureRecommendationList$ = this.store.pipe(
    select(selectorEventFeatureRecommendationList),
    tap((res) => {
      if (res) {
        this.eventFeatureRecommendationList.set(res);
      }
    })
  );
  hotelSuggestedFeatureCodeList = computed(() => {
    return this.eventFeatureRecommendationList()?.popularRetailFeatureList?.map(
      (x) => x?.code
    );
  });
  buttonTextColor$ = this.hotelConfigService.buttonTextColor$;
  categoryHoverText$ = this.hotelConfigService.categoryHoverText$;
  categoryHoverBg$ = this.hotelConfigService.categoryHoverBg$;
  colorText$ = this.hotelConfigService.colorText$;
  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;
  categoryDefaultText$ = this.hotelConfigService.categoryDefaultText$;
  categoryDefaultBg$ = this.hotelConfigService.categoryDefaultBg$;
  featureDefaultIcon$ = this.hotelConfigService.featureSelectedText$;
  featureHoverIcon$ = this.hotelConfigService.featureHoverText$;

  value$ = new BehaviorSubject<any>(null);
  destroyed$ = new Subject();
  tripPurpose$: Observable<HotelTag[]> = this.store.pipe(
    select(selectorHotelTagList),
    map((data) => {
      if (data?.length > 0) {
        return data?.filter((item) => item?.assignedFeatureList?.length > 0);
      }

      return null;
    })
  );

  overlayRef: OverlayRef;
  isOpen: boolean;
  isOpenRanking = signal(false);
  categorySelected = signal(this.configuratorService.categorySelected());
  featureSelected = signal(this.configuratorService.featureSelected());
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
  viewport = signal(0);

  ngAfterViewInit() {
    const orderedCategory = new OrderBySelectedFeaturesPipe().transform(
      this.hotelRetailCategoryList(),
      this.featureSelected()
    );
    const index = orderedCategory?.findIndex(
      (x) => x?.code === this.categorySelected()?.code
    );
    this.swiperComponent?.swiperRef?.slideTo(index, 300);
    this.viewport.set(document.documentElement.clientHeight - 150);
  }

  onBackClick(): void {
    this.closeConfigurator();
  }

  selectCategory(cFeature: HotelRetailCategory) {
    this.categorySelected.set(cFeature);
    this.configuratorService.categorySelected.set(cFeature);
  }

  handlerToggleItem(code: string): void {
    const index = this.featureSelected()?.findIndex((x) => x === code);
    this.featureSelected.update((values) =>
      index < 0 ? [...values, code] : values?.filter((x) => x !== code)
    );
    const feature =
      this.eventFeatureRecommendationList()?.[0]?.popularRetailFeatureList?.find(
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
    this.cd.detectChanges();
  }

  onSlideChange(event): void {
    this.progressCategoryValue = +event?.['progress'];
    this.isFirstSlide.set(event?.activeIndex === 0);
    this.cd.detectChanges();
  }

  closeConfigurator(): void {
    this.isOpen = false;
    setTimeout(() => {
      this.overlayRef?.detach();
    }, 500);
  }

  clear(): void {
    this.featureSelected.set([]);
  }

  apply(): void {
    this.updateFeatureParams();
    const arr = [
      ...this.curFeatureRankings()
        ?.map((x) => x?.features?.map((x) => x?.code))
        ?.reduce((a, b) => a.concat(b), [])
    ];
    this.featureSelected.set(arr || []);
    this.configuratorService.featureSelected.set(this.featureSelected());
    this.closeConfigurator();
    this.bookingTransactionService.updateQueryParams(() => {
      this.suggestionHandlerService.loadAvailableStayOptions();
    });
  }

  private updateFeatureParams() {
    const featureParam = this.curFeatureRankings()
      ?.map(
        (x) =>
          `${x?.category?.code}-${x?.features?.map((x) => x?.code)?.join('-')}`
      )
      ?.reduce((arr, cur) => arr.concat(cur), [])
      ?.join(',');
    this.configuratorService.featureParam.set(featureParam);
  }

  addSuggestFeature(code: string) {
    this.handlerToggleItem(code);
    const categoryCode = this.hotelRetailFeatureList()?.find(
      (x) => x?.code === code
    )?.hotelRetailCategory?.code;
    const category = this.hotelRetailCategoryList()?.find(
      (x) => x?.code === categoryCode
    );
    const categoryIdx = this.hotelRetailCategoryList()?.findIndex(
      (x) => x?.code === categoryCode
    );
    this.swiperComponent.swiperRef.slideTo(categoryIdx, 300);
    this.selectCategory(category);
    this.scrollToTargetElement(code);
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

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(
      this.curFeatureRankings(),
      event.previousIndex,
      event.currentIndex
    );
    const arr = [
      ...this.curFeatureRankings()
        ?.map((x) => x?.features?.map((x) => x?.code))
        ?.reduce((a, b) => a.concat(b), [])
    ];
    this.featureSelected.set(arr?.length ? arr : []);
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
}
