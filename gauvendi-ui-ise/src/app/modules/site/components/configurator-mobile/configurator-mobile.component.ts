import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, computed,
  inject,
  Input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { distinctUntilChanged, noop, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import {
  ConvertSuggestedFeatureTextPipe,
} from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/convert-suggested-feature-text.pipe';
import {
  FeatureCountConfiguratorPipe,
} from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/feature-count-configurator.pipe';
import {
  FilterRetailFeatureSelectedPipe,
} from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/filter-retail-feature-selected.pipe';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import {
  IseConfiguratorModule,
} from '@app/modules/site/pages/recommendation/directives/ise-configurator/ise-configurator.module';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  HotelRetailCategory,
  HotelRetailFeature,
  WidgetEventFeatureRecommendation,
} from '@core/graphql/generated/graphql';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { SwiperComponent, SwiperModule } from 'swiper/angular';
import { SwiperOptions } from 'swiper';
import { MatIconModule } from '@angular/material/icon';
import { OverlayMobileDirective } from '@app/modules/site/directives/overlay-mobile.directive';
import {
  ConfiguratorManagementMobileComponent,
} from '@app/modules/site/components/configurator-management-mobile/configurator-management-mobile.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { TrackingService } from '@app/services/tracking.service';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { ImageHoveringComponent } from '@app/shared/components/image-hovering/image-hovering.component';

@Component({
  selector: 'app-configurator-mobile',
  standalone: true,
  imports: [
    CommonModule,
    ConvertSuggestedFeatureTextPipe,
    FeatureCountConfiguratorPipe,
    FilterRetailFeatureSelectedPipe,
    FilterSvgDirective,
    IseConfiguratorModule,
    TranslatePipe,
    SwiperModule,
    MatIconModule,
    OverlayMobileDirective,
    CustomTooltipModule,
    ImageHoveringComponent,
  ],
  templateUrl: './configurator-mobile.component.html',
  styleUrls: ['./configurator-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguratorMobileComponent extends DirSettingDirective implements OnInit {
  @Input() hotelRetailCategoryList: HotelRetailCategory[];
  @Input() hotelRetailFeatureList: HotelRetailFeature[];
  @Input() eventFeatureRecommendationList: WidgetEventFeatureRecommendation;
  @ViewChild('swiperComponent') swiper: SwiperComponent;
  config: SwiperOptions = {
    navigation: {
      prevEl: '.navigation__left',
      nextEl: '.navigation__right'
    },
    pagination: false,
    slidesPerView: 'auto',
    spaceBetween: 8,
    loop: false,

  };
  featureSelected = this.configuratorService.featureSelected;
  featureRankings = computed(() => {
    const arr = this.configuratorService.featureParam()?.split(',');
    arr?.map(x => {
      const categoryCode = x?.split('-')?.[0];
      return {
        category: this.hotelRetailCategoryList?.find(cate => cate?.code === categoryCode),
        features: this.hotelRetailFeatureList?.filter(re => x?.split('-')?.includes(re?.code))
      }
    })
    return arr?.map(x => {
      const categoryCode = x?.split('-')?.[0];
      return {
        category: this.hotelRetailCategoryList?.find(cate => cate?.code === categoryCode),
        features: this.hotelRetailFeatureList?.filter(re => x?.split('-')?.includes(re?.code))
      }
    });
  });
  popUpComponent = ConfiguratorManagementMobileComponent;
  trackingService = inject(TrackingService);
  destroyed$ = new Subject();
  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;
  isNext = signal(false);
  categoryDefaultText$ = this.hotelConfigService.categoryDefaultText$;
  categoryDefaultBg$ = this.hotelConfigService.categoryDefaultBg$;
  featureDefaultIcon$ = this.hotelConfigService.featureSelectedText$;
  featureHoverIcon$ = this.hotelConfigService.featureHoverText$;
  buttonTextColor$ = this.hotelConfigService.buttonTextColor$;

  constructor(
    private hotelConfigService: HotelConfigService,
    private configuratorService: ConfiguratorService,
    private cd: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit() {
    this.route.queryParams.pipe(
      map(params => params[RouteKeyQueryParams.customizeStay]),
      distinctUntilChanged((prev, next) => JSON.stringify(prev) === JSON.stringify(next)),
      takeUntil(this.destroyed$)
    ).subscribe((val) => {
      const categories = val?.split(',');
      if (categories?.length > 0) {
        const currentRetailParams = [...categories.reduce((p, c) => {
          const temp = c.split('-');
          if (temp?.length > 2) {
            temp.splice(0, 1);
            return p?.concat(temp);
          }
          return p?.concat(temp[1]);
        }, [])];
        this.featureSelected.set([...currentRetailParams]);
        this.configuratorService.featureSelected.set([...currentRetailParams]);
      } else {
        this.featureSelected.set([]);
        this.configuratorService.featureSelected.set([]);
      }
    });
  }

  selectCategory(cFeature: HotelRetailCategory) {
    this.configuratorService.categorySelected.set(cFeature);
  }

  handleFeature(code: string) {
    const index = this.featureSelected()?.findIndex(x => x === code);
    this.featureSelected.update(values => index < 0 ? [...values, code] : values?.filter(x => x !== code));
    const feature = this.hotelRetailFeatureList?.find(x => x?.code === code);
    !this.featureSelected()?.includes(code)
      ? this.trackingService.track(MixpanelKeys.SelectFeature, {
          name: 'Configurator',
          category_code: feature?.hotelRetailCategory?.code,
          feature_code: feature?.code
        }
      )
      : noop();
    this.configuratorService.featureSelected.set([...this.featureSelected()])
  }

  addSuggestFeature(code: string) {
    const categoryCode = this.hotelRetailFeatureList?.find(x => x?.code === code)?.hotelRetailCategory?.code;
    const category = this.hotelRetailCategoryList?.find(x => x?.code === categoryCode);
    this.handleFeature(code);
    this.selectCategory(category);
    // this.configuratorService.suggestSelected.update(values => index < 0 ? [...values, code] : values?.filter(x => x !== code))
  }

  nextFeature(hotelRetailCategoryList: HotelRetailCategory[]) {
    if (this.isNext()) {
      this.swiper.swiperRef.slideTo(0, 300);
    } else {
      this.swiper.swiperRef.slideTo(hotelRetailCategoryList?.length, 300);
    }
    this.isNext.set(!this.isNext());
    this.cd.detectChanges();
  }
}
