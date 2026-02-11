import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SpaceTypeCategoryCode } from '@app/constants/space-type.const';
import { ViewportService } from '@app/core/services/viewport.service';
import { AbstractSpaceTypeComponent } from '@app/modules/site/components/abstracts/abstract-space-type.component';
import { ISPTFeature } from '@app/modules/site/components/abstracts/interfaces/abstract-space-type.interface';
import { FeatureIncludedMatchFlowComponent } from '@app/modules/site/pages/recommendation/components/feature-included-match-flow/feature-included-match-flow.component';
import { FeatureIncludedComponent } from '@app/modules/site/pages/recommendation/components/feature-included/feature-included.component';
import { MatchingPercentTagComponent } from '@app/modules/site/pages/recommendation/components/matching-percent-tag/matching-percent-tag.component';
import { OptionItemTagComponent } from '@app/modules/site/pages/recommendation/components/option-item-tag/option-item-tag.component';
import { RfcRatePlanComponent } from '@app/modules/site/pages/recommendation/components/rfc-rate-plan/rfc-rate-plan.component';
import { StandardFeaturesComponent } from '@app/modules/site/pages/recommendation/components/standard-features/standard-features.component';
import { CheckOptionPromotedPipe } from '@app/modules/site/pages/recommendation/pipes/check-option-promoted.pipe';
import { GetDealCodePipe } from '@app/modules/site/pages/recommendation/pipes/get-deal-code.pipe';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { ImageZoomableComponent } from '@app/shared/components/image-zoomable/image-zoomable.component';
import { OptionUnitsInfoComponent } from '@app/shared/components/option-units-info/option-units-info.component';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { ParseImageUrlPipe } from '@app/shared/pipes/parse-image-url.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  BookingFlow,
  HotelTaxSettingEnum
} from '@core/graphql/generated/graphql';
import { EDisplayMode } from '@models/display-mode.model';
import { EPriceView, IOptionItem } from '@models/option-item.model';
import { select } from '@ngrx/store';
import {
  selectorLowestPriceImageUrl,
  selectorLowestPriceOpaque
} from '@store/hotel/hotel.selectors';
import { parse } from 'date-fns';
import { map, Observable, tap } from 'rxjs';
import { OptionSwiperComponent } from '../option-swiper/option-swiper.component';

@Component({
  selector: 'app-option-item-detail',
  standalone: true,
  imports: [
    CheckOptionPromotedPipe,
    CommonModule,
    FeatureIncludedComponent,
    FeatureIncludedMatchFlowComponent,
    FilterSvgDirective,
    GetDealCodePipe,
    MatchingPercentTagComponent,
    MatDialogModule,
    MatIconModule,
    OptionItemTagComponent,
    OptionSwiperComponent,
    OptionUnitsInfoComponent,
    ParseImageUrlPipe,
    RfcRatePlanComponent,
    StandardFeaturesComponent,
    TranslatePipe
  ],
  templateUrl: './option-item-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionItemDetailComponent extends AbstractSpaceTypeComponent {
  private commonService = inject(CommonService);
  readonly viewportService = inject(ViewportService);

  @Input() data: IOptionItem;
  @Input() isAlternativeOption: boolean;
  @Input() isFromMatchingRfc: boolean;
  @Input() isHighLight: boolean;
  @Input() isRecommendationDetail: boolean;

  @Output() closeConfigurator = new EventEmitter();
  @Output() selectRatePlan = new EventEmitter();

  isMobile$ = this.viewportService.isMobile$();
  isLowestPriceOpaque$ = this.store.pipe(select(selectorLowestPriceOpaque));
  lowestPriceImageUrl$ = this.store.select(selectorLowestPriceImageUrl);
  isMatchFlow$: Observable<boolean> = this.route.queryParams.pipe(
    map((params) => +params[RouteKeyQueryParams.customize] === 1)
  );
  BookingFlow = BookingFlow;
  tag = [
    BookingFlow.LowestPrice,
    BookingFlow.MostPopular,
    BookingFlow.Recommended
  ];

  roomSummary$ = this.commonService.roomSummary$;
  EDisplayMode = EDisplayMode;
  priceState$: Observable<EPriceView> = this.route.queryParams.pipe(
    map(() => EPriceView.PerNight)
  );
  includeTax$ = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );
  promoCode$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.promoCode])
  );

  bookingDuration = this.bookingTransactionService.getNumberOfNight([
    parse(
      this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate],
      'dd-MM-yyyy',
      new Date()
    ),
    parse(
      this.route.snapshot.queryParams[RouteKeyQueryParams.checkOutDate],
      'dd-MM-yyyy',
      new Date()
    )
  ]);

  googleTrackingService = inject(GoogleTrackingService);

  constructor(
    private readonly bookingTransactionService: BookingTransactionService,
    private readonly configService: HotelConfigService,
    private readonly dialog: MatDialog
  ) {
    super();
  }

  override setSpaceTypeFeatures(): ISPTFeature[] {
    const features = this.data.features;
    if (!features?.length) return [];

    return features
      .filter(
        (feature) =>
          feature.metadata.hotelRetailCategory?.code ===
            SpaceTypeCategoryCode ||
          feature.metadata.code.startsWith(`${SpaceTypeCategoryCode}_`)
      )
      .map((item) => ({ name: item.name, code: item.metadata?.code }));
  }

  zoomIn(imgUrls: string[], isNoFeatures: boolean, lowestPriceUrl: string) {
    this.dialog.open(ImageZoomableComponent, {
      maxWidth: '95vw',
      maxHeight: '80vh',
      panelClass: 'rounded-dialog',
      direction: this.direction(),
      data: {
        imgUrls: isNoFeatures ? [lowestPriceUrl] : imgUrls
      }
    });
  }
}
