import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  SimpleChanges
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EDeviceType } from '@app/models/device.model';
import { FeatureIncludedMatchFlowComponent } from '@app/modules/site/pages/recommendation/components/feature-included-match-flow/feature-included-match-flow.component';
import { FeatureIncludedComponent } from '@app/modules/site/pages/recommendation/components/feature-included/feature-included.component';
import { MatchingPercentTagComponent } from '@app/modules/site/pages/recommendation/components/matching-percent-tag/matching-percent-tag.component';
import { OptionItemTagComponent } from '@app/modules/site/pages/recommendation/components/option-item-tag/option-item-tag.component';
import { OptionPriceComponent } from '@app/modules/site/pages/recommendation/components/option-price/option-price.component';
import { OptionSwiperComponent } from '@app/modules/site/pages/recommendation/components/option-swiper/option-swiper.component';
import { StandardFeaturesComponent } from '@app/modules/site/pages/recommendation/components/standard-features/standard-features.component';
import { CalUnitCombinationOptionPricePipe } from '@app/modules/site/pages/recommendation/pipes/cal-unit-combination-option-price.pipe';
import { CheckOptionPromotedPipe } from '@app/modules/site/pages/recommendation/pipes/check-option-promoted.pipe';
import { CombinationOptionCarouselItemStylePipe } from '@app/modules/site/pages/recommendation/pipes/combination-option-carousel-item-style.pipe';
import { GetDealCodePipe } from '@app/modules/site/pages/recommendation/pipes/get-deal-code.pipe';
import { RenderCombinationTitlePipe } from '@app/modules/site/pages/recommendation/pipes/render-combination-title.pipe';
import { TagColorPipe } from '@app/modules/site/pages/recommendation/pipes/tag-color.pipe';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { ImageZoomableComponent } from '@app/shared/components/image-zoomable/image-zoomable.component';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { ParseImageUrlPipe } from '@app/shared/pipes/parse-image-url.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  BookingFlow,
  HotelTaxSettingEnum
} from '@core/graphql/generated/graphql';
import { EDisplayMode } from '@models/display-mode.model';
import { EPriceView, ICombinationOptionItem } from '@models/option-item.model';
import { select, Store } from '@ngrx/store';
import {
  selectorLowestPriceImageUrl,
  selectorLowestPriceOpaque
} from '@store/hotel/hotel.selectors';
import { map, Observable, of, tap } from 'rxjs';
import { RfcRatePlanComponent } from '../rfc-rate-plan/rfc-rate-plan.component';
import { OptionUnitsInfoComponent } from '@app/shared/components/option-units-info/option-units-info.component';
import { CommonService } from '@app/services/common.service';

@Component({
  selector: 'app-combination-option-item-mobile',
  standalone: true,
  imports: [
    CalUnitCombinationOptionPricePipe,
    CheckOptionPromotedPipe,
    CombinationOptionCarouselItemStylePipe,
    CommonModule,
    FeatureIncludedComponent,
    FeatureIncludedMatchFlowComponent,
    FilterSvgDirective,
    GetDealCodePipe,
    MatchingPercentTagComponent,
    MatDialogModule,
    OptionItemTagComponent,
    OptionPriceComponent,
    OptionSwiperComponent,
    OptionUnitsInfoComponent,
    ParseImageUrlPipe,
    RenderCombinationTitlePipe,
    RfcRatePlanComponent,
    StandardFeaturesComponent,
    TagColorPipe,
    TranslatePipe
  ],
  templateUrl: './combination-option-item-mobile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CombinationOptionItemMobileComponent extends DirSettingDirective {
  private commonService = inject(CommonService);

  @Input() data: ICombinationOptionItem;
  @Input() isAlternativeOption: boolean;
  @Input() isFromMatchingRfc: boolean;
  @Input() isHighLight: boolean;
  @Input() isRecommendationDetail: boolean;
  @Input() roomIdxView: number;

  @Output() closeConfigurator = new EventEmitter();
  @Output() selectRatePlan = new EventEmitter();
  @Output() selectedIndex = new EventEmitter();

  isLowestPriceOpaque$ = this.store.pipe(select(selectorLowestPriceOpaque));
  lowestPriceImageUrl$ = this.store.select(selectorLowestPriceImageUrl);
  isMatchFlow$: Observable<boolean> = this.route.queryParams.pipe(
    map((params) => +params[RouteKeyQueryParams.customize] === 1)
  );
  BookingFlow = BookingFlow;
  roomSummary$ = this.commonService.roomSummary$;
  EDisplayMode = EDisplayMode;
  EDeviceType = EDeviceType;
  tag = [
    BookingFlow.LowestPrice,
    BookingFlow.MostPopular,
    BookingFlow.Recommended
  ];
  priceState$: Observable<EPriceView> = this.route.queryParams.pipe(
    map(() => EPriceView.PerNight)
  );
  includeTax$ = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );
  colorText$ = this.configService.colorText$;
  promoCode$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.promoCode])
  );
  activeIndex = 0;
  isMobile = false;

  constructor(
    private readonly bookingTransactionService: BookingTransactionService,
    private readonly configService: HotelConfigService,
    private readonly dialog: MatDialog,
    private readonly store: Store
  ) {
    super();
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('roomIdxView')) {
      this.activeIndex = this.roomIdxView;
    }
  }

  setActiveIndex(index: number): void {
    this.activeIndex = index;
    this.selectedIndex.emit(this.activeIndex);
  }
  zoomIn(
    imgUrls: string[],
    isNoFeatures: boolean,
    lowestPriceImageUrl: string
  ) {
    this.dialog.open(ImageZoomableComponent, {
      maxWidth: '95vw',
      maxHeight: '80vh',
      panelClass: 'rounded-dialog',
      direction: this.direction(),
      data: {
        imgUrls: isNoFeatures ? [lowestPriceImageUrl] : imgUrls
      }
    });
  }
}
