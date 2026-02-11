import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SearchBarHandlerService } from '@app/services/search-bar-handler.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { TrackingService } from '@app/services/tracking.service';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  CategoryTypeEnum,
  HotelRetailCategory,
  HotelRetailFeature,
  HotelTag
} from '@core/graphql/generated/graphql';
import { select, Store } from '@ngrx/store';
import { selectorHotelTagList } from '@store/hotel-tag/hotel-tag.selectors';
import {
  selectorEventFeatureRecommendationList,
  selectorHotelRetailCategoryList,
  selectorHotelRetailFeatureList
} from '@store/hotel/hotel.selectors';
import { chain } from 'lodash';
import { noop, Observable, Subject, Subscription, timer } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-ise-configurator-management',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatExpansionModule],
  templateUrl: './ise-configurator-management.component.html',
  styleUrls: ['./ise-configurator-management.component.scss']
})
export class IseConfiguratorManagementComponent implements OnInit, OnDestroy {
  maxWidth: number;
  isDisplayed = false;
  overlayRef: OverlayRef;
  isExpandedTripPurpose = false;
  eventFeatureRecommendationList$ = this.store.pipe(
    select(selectorEventFeatureRecommendationList)
  );
  hotelRetailCategoryList$ = this.store.pipe(
    select(selectorHotelRetailCategoryList),
    tap((res) => {
      if (res?.length > 0) {
        this.cloneRetailCategoryList = [...res];
      }
    })
  );
  hotelRetailFeatureList$ = this.store.pipe(
    select(selectorHotelRetailFeatureList),
    tap((res) => {
      if (res?.length > 0) {
        this.cloneRetailFeatureList = [...res];
        if (this.configuratorService.getSelectedRetailFeatures()?.length > 0) {
          const selected = this.cloneRetailFeatureList?.find(
            (item) =>
              item?.code ===
              this.configuratorService.getSelectedRetailFeatures()[0]
          )?.hotelRetailCategory?.code;
          if (!this.configuratorService.getSelectedCategory().code) {
            this.configuratorService.setSelectedCategory(
              this.cloneRetailCategoryList?.find((x) => x?.code === selected)
            );
            this.selectCategory(this.configuratorService.getSelectedCategory());
            return;
          }
          this.selectCategory(this.configuratorService.getSelectedCategory());
          return;
        }
        this.selectCategory(this.configuratorService.getSelectedCategory());
      }
    })
  );
  isCurrentSelected$ = this.configuratorService._isCurrentSelected();
  tripPurpose$: Observable<HotelTag[]> = this.store.pipe(
    select(selectorHotelTagList),
    map((data) => {
      if (data?.length > 0) {
        return data?.filter((item) => item?.assignedFeatureList?.length > 0);
      }

      return null;
    })
  );
  selectedCategory$ = this.configuratorService._selectedCategory();
  selectedRetailFeatures$ = this.configuratorService._selectedRetailFeatures();
  retailFeaturePreview: HotelRetailFeature[] = [];
  cloneRetailFeatureList: HotelRetailFeature[] = [];
  cloneRetailCategoryList: HotelRetailCategory[] = [];
  destroyed$ = new Subject();
  totalAdults$ = this.bookingTransactionService.travelerSelected$.pipe(
    map((res) => {
      if (res) {
        const { adults: adult } = this.bookingTransactionService.getTraveler(
          this.bookingTransactionService?.travelerSelected$?.value
        );
        return +adult;
      }
      return 0;
    })
  );
  totalChildren$ = this.bookingTransactionService.travelerSelected$.pipe(
    map((res) => {
      if (res) {
        const { children } = this.bookingTransactionService.getTraveler(
          this.bookingTransactionService?.travelerSelected$?.value
        );
        return +children;
      }
      return 0;
    })
  );

  colorText$ = this.hotelConfigService.colorText$;
  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;

  numRandom = 0;
  isShowPreTooltip = false;
  sub: Subscription;

  constructor(
    private cd: ChangeDetectorRef,
    private store: Store,
    private configuratorService: ConfiguratorService,
    private route: ActivatedRoute,
    private appRouterService: AppRouterService,
    private trackingService: TrackingService,
    private bookingTransactionService: BookingTransactionService,
    private suggestionHandlerService: SuggestionHandlerService,
    private searchBarHandlerService: SearchBarHandlerService,
    private hotelConfigService: HotelConfigService
  ) {}

  ngOnInit() {
    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.closePanel();
      });
  }

  closePanel(): void {
    this.isDisplayed = false;
    this.cd.detectChanges();
    setTimeout(() => {
      this.overlayRef.detach();
      this.searchBarHandlerService.openOverlayState$.next(null);
    }, 400);
  }

  onSelectSuggestionFeature(
    selectedFeatureList: HotelRetailFeature[],
    hotelRetailCategory: HotelRetailCategory[]
  ): void {
    const selectedCategory = selectedFeatureList?.map((item) => ({
      code: item?.code,
      categoryCode: item?.hotelRetailCategory?.code
    }));

    const selected = hotelRetailCategory?.find(
      (item) => item?.code === selectedCategory[0]?.categoryCode
    );
    // this.configuratorService.setSelectedCategory(selected);
    this.selectCategory(selected);
    const customizeStay = chain(selectedCategory)
      .groupBy('categoryCode')
      .map(
        (value, key) => `${key}-${value?.map((item) => item?.code)?.join('-')}`
      )
      .value()
      .reduce((p, c) => {
        return p?.concat(c);
      }, [])
      ?.join(',');
    this.isShowPreTooltip = false;
    this.sub?.unsubscribe();
    this.onTimer();
    this.appRouterService.updateRouteQueryParams({
      ...this.route.snapshot.queryParams,
      [RouteKeyQueryParams.customizeStay]:
        customizeStay?.length > 0 ? customizeStay : null
    });
  }

  selectCategory(cFeature: HotelRetailCategory) {
    this.configuratorService.setSelectedCategory(cFeature);
    this.configuratorService.setIsCurrentSelected(false);
    const filterSelected = [...this.cloneRetailFeatureList]?.filter(
      (retail) =>
        retail?.hotelRetailCategory?.code ===
        this.configuratorService.getSelectedCategory()?.code
    );
    const selectedList = [...filterSelected]?.filter((item) =>
      this.configuratorService.getSelectedRetailFeatures()?.includes(item?.code)
    );
    const notSelectedList = [...filterSelected]?.filter(
      (item) =>
        !this.configuratorService
          .getSelectedRetailFeatures()
          ?.includes(item?.code)
    );
    this.retailFeaturePreview = [...selectedList, ...notSelectedList];
    this.isShowPreTooltip = false;
    this.sub?.unsubscribe();
    this.onTimer();
    this.cd.detectChanges();
  }

  handlerToggleItem(item: HotelRetailFeature): void {
    this.configuratorService.setIsCurrentSelected(true);
    const currentCategoryType =
      this.configuratorService.getSelectedCategory()?.categoryType;
    if (currentCategoryType !== CategoryTypeEnum.MultipleOption) {
      return;
    }
    let data = [
      ...(this.configuratorService?.getSelectedRetailFeatures() || [])
    ];
    if (data?.includes(item?.code)) {
      data = data?.filter((code) => code !== item?.code);
    } else {
      data.push(item?.code);
    }
    this.configuratorService.setSelectedRetailFeatures([...data]);
    this.isShowPreTooltip = false;
    this.sub?.unsubscribe();
    this.onTimer();

    this.updateQueryParams();

    !data?.includes(item?.code)
      ? this.trackingService.track(MixpanelKeys.SelectFeature, {
          name: 'Configurator',
          category_code: item?.hotelRetailCategory?.code,
          feature_code: item?.code
        })
      : noop();
    this.cd.detectChanges();
  }

  updateQueryParams(): void {
    const queryParams = this.route.snapshot.queryParams;
    const selectedCodes: string[] = [
      ...(this.configuratorService?.getSelectedRetailFeatures() || [])
    ];
    if (selectedCodes?.length === 0 || !selectedCodes) {
      this.appRouterService.updateRouteQueryParams({
        ...queryParams,
        [RouteKeyQueryParams.customizeStay]: null
      });
      return;
    }

    const selectedRetailFeatures = [...this.cloneRetailFeatureList]
      ?.sort(
        (pre, cur) =>
          selectedCodes.indexOf(pre.code) - selectedCodes.indexOf(cur.code)
      )
      ?.filter((x) => selectedCodes?.includes(x?.code))
      ?.map((x) => ({
        code: x?.code,
        categoryCode: x?.hotelRetailCategory?.code
      }));
    const customizeStay = chain(selectedRetailFeatures)
      .groupBy('categoryCode')
      .map(
        (value, key) => `${key}-${value?.map((item) => item?.code)?.join('-')}`
      )
      .value()
      .reduce((p, c) => {
        return p?.concat(c);
      }, [])
      ?.join(',');

    this.appRouterService.updateRouteQueryParams({
      ...queryParams,
      [RouteKeyQueryParams.customizeStay]: customizeStay
    });
  }

  onTimer() {
    this.sub = timer(2000, 4500)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.isShowPreTooltip = !this.isShowPreTooltip;
        if (this.isShowPreTooltip) {
          this.onCheckCateSelected();
        }
        this.cd.markForCheck();
      });
  }

  onCheckCateSelected(): void {
    const selectedFeatures =
      this.configuratorService.getSelectedRetailFeatures();
    if (!this.cloneRetailCategoryList?.length) {
      return;
    }
    const selectedFeatured = [...this.cloneRetailFeatureList]
      ?.sort(
        (pre, cur) =>
          selectedFeatures.indexOf(pre.code) -
          selectedFeatures.indexOf(cur.code)
      )
      ?.filter((item) => selectedFeatures?.includes(item?.code));
    const selectedCategory = selectedFeatured?.map(
      (x) => x?.hotelRetailCategory?.code
    );
    const categoryCodes = this.cloneRetailCategoryList
      ?.map((item) => item.code)
      ?.map((x) => (selectedCategory?.includes(x) ? 'used' : x));
    if (
      categoryCodes.length > 0 &&
      categoryCodes.every((item) => item === 'used')
    ) {
      this.numRandom = -1;
      return;
    }
    this.numRandom = Math.floor(
      Math.random() * this.cloneRetailCategoryList?.length
    );
    if (categoryCodes?.filter((x) => x !== 'used')?.length > 1) {
      while (
        categoryCodes[this.numRandom] === 'used' ||
        categoryCodes[this.numRandom] ===
          this.configuratorService.getSelectedCategory().code
      ) {
        this.numRandom = Math.floor(
          Math.random() * this.cloneRetailCategoryList?.length
        );
      }
    } else {
      let lastItem = categoryCodes.findIndex((x) => x !== 'used');
      if (
        categoryCodes[lastItem] ===
        this.configuratorService.getSelectedCategory().code
      ) {
        this.numRandom = -1;
      } else {
        this.numRandom = lastItem;
      }
    }
  }

  clear(): void {
    // this.closePanel();
    const queryParams = this.route.snapshot.queryParams;
    this.appRouterService.updateRouteQueryParams({
      ...queryParams,
      [RouteKeyQueryParams.customizeStay]: null
    });
  }

  ngOnDestroy() {
    this.destroyed$.next('');
    this.destroyed$.complete();
    this.sub?.unsubscribe();
  }

  submit() {
    this.bookingTransactionService.updateQueryParams();
    setTimeout(() => {
      this.closePanel();
      this.configuratorService.setIsCurrentSelected(false);
      this.suggestionHandlerService.loadAvailableStayOptions();
      this.searchBarHandlerService.openOverlayState$.next(null);
    }, 100);
  }
}
