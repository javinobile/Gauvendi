import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  Input,
  Output
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { GoogleTrackingEvents } from '@app/constants/datalayer.enum';
import { SpaceTypeCategoryCode } from '@app/constants/space-type.const';
import {
  BookingFlow,
  HotelTaxSettingEnum,
  RfcRestriction
} from '@app/core/graphql/generated/graphql';
import { IRoomSummary } from '@app/models/common.model';
import { EDisplayMode } from '@app/models/display-mode.model';
import { EPriceView, IOptionItem } from '@app/models/option-item.model';
import { AbstractSpaceTypeComponent } from '@app/modules/site/components/abstracts/abstract-space-type.component';
import { ISPTFeature } from '@app/modules/site/components/abstracts/interfaces/abstract-space-type.interface';
import { OverlayMobileDirective } from '@app/modules/site/directives/overlay-mobile.directive';
import { DirectCalendarMobileComponent } from '@app/modules/site/pages/recommendation/components/direct-calendar-mobile/direct-calendar-mobile.component';
import { OptionItemDetailOverlayComponent } from '@app/modules/site/pages/recommendation/components/option-item-detail-overlay/option-item-detail-overlay.component';
import { CheckOptionPromotedPipe } from '@app/modules/site/pages/recommendation/pipes/check-option-promoted.pipe';
import { GetDealCodePipe } from '@app/modules/site/pages/recommendation/pipes/get-deal-code.pipe';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { CartService } from '@app/services/cart.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { TrackingService } from '@app/services/tracking.service';
import { ImageCustomComponent } from '@app/shared/components/image-custom/image-custom.component';
import { ImageZoomableComponent } from '@app/shared/components/image-zoomable/image-zoomable.component';
import { OptionUnitsInfoComponent } from '@app/shared/components/option-units-info/option-units-info.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { CalculatePriceWithTaxPipe } from '@app/shared/pipes/calculate-price-with-tax.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { SectionCodeEnum } from '@app/store/multi-lang/multi-lang.state';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import { format, parse } from 'date-fns';
import { map } from 'rxjs/operators';
import { CalculateFullPriceWithTaxPipe } from '../../../../../../shared/pipes/calculate-full-price-with-tax.pipe';
import { OptionIconPipe } from '../../pipes/option-icon.pipe';
import { FeatureIncludedMatchFlowComponent } from '../feature-included-match-flow/feature-included-match-flow.component';
import { FeatureIncludedComponent } from '../feature-included/feature-included.component';
import { MatchingPercentTagComponent } from '../matching-percent-tag/matching-percent-tag.component';
import { OptionItemTagComponent } from '../option-item-tag/option-item-tag.component';
import { OptionPriceComponent } from '../option-price/option-price.component';
import { OptionSwiperComponent } from '../option-swiper/option-swiper.component';
import { RfcRatePlanComponent } from '../rfc-rate-plan/rfc-rate-plan.component';
import { RoomRestrictionComponent } from '../room-restriction/room-restriction.component';
import { StandardFeaturesComponent } from '../standard-features/standard-features.component';

@Component({
  selector: 'app-option-item',
  standalone: true,
  templateUrl: './option-item.component.html',
  styleUrls: [`./option-item.component.scss`],
  imports: [
    CalculatePriceWithTaxPipe,
    CheckOptionPromotedPipe,
    CommonModule,
    CustomTooltipModule,
    FeatureIncludedComponent,
    FeatureIncludedMatchFlowComponent,
    FilterSvgDirective,
    GetDealCodePipe,
    ImageCustomComponent,
    MatchingPercentTagComponent,
    MatDialogModule,
    MatIconModule,
    OptionIconPipe,
    OptionItemTagComponent,
    OptionPriceComponent,
    OptionSwiperComponent,
    OptionUnitsInfoComponent,
    OverlayMobileDirective,
    RfcRatePlanComponent,
    RoomRestrictionComponent,
    StandardFeaturesComponent,
    TranslatePipe,
    CalculateFullPriceWithTaxPipe
  ]
})
export class OptionItemComponent extends AbstractSpaceTypeComponent {
  private bookingTransactionService = inject(BookingTransactionService);
  private cartService = inject(CartService);
  private configService = inject(HotelConfigService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private suggestionHandlerService = inject(SuggestionHandlerService);
  private trackingService = inject(TrackingService);
  private googleTrackingService = inject(GoogleTrackingService);
  private appRouterService = inject(AppRouterService);

  @Input({ required: true }) displayMode: EDisplayMode;
  @Input({ required: true }) isLowestPriceOpaque: boolean;
  @Input({ required: true }) item: IOptionItem;
  @Input({ required: true }) lowestPriceImageUrl: string;
  @Input({ required: true }) restrictionValidationList: RfcRestriction[];
  @Input() buttonTextColor: string;
  @Input() changeDateFromDirectOption: boolean = false;
  @Input() collapsed: boolean = false;
  @Input() isAlternativeOption = false;
  @Input() isDetails: boolean = false;
  @Input() isFromMatchingRfc: boolean = false;
  @Input() isHighLight = false;
  @Input() isSelected: boolean = false;
  @Input() priceView: EPriceView = EPriceView.PerStay;
  @Input() showMatch: boolean = false;
  @Input() step2CompactMode: boolean = true;
  @Input() isStep2 = false;
  @Input() isBundle = false;
  roomSummary = input<IRoomSummary>();

  @Output() clear = new EventEmitter();
  @Output() selectItem = new EventEmitter();
  @Output() selectRatePlan = new EventEmitter<string>();

  BookingFlow = BookingFlow;
  EDisplayMode = EDisplayMode;
  EPriceView = EPriceView;
  optionItemDetailComponent = OptionItemDetailOverlayComponent;
  SectionCodeEnum = SectionCodeEnum;
  tag = [
    BookingFlow.LowestPrice,
    BookingFlow.MostPopular,
    BookingFlow.Recommended
  ];

  includeTax$ = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );
  promoCode$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.promoCode])
  );

  directCalendarMobile = DirectCalendarMobileComponent;
  isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
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

  isSearchChanged = this.cartService.isSearchChanged;

  override setSpaceTypeFeatures(): ISPTFeature[] {
    const features = this.item.features;
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

  viewDetail() {
    if (window.innerWidth < 1024) {
      this.onTrack();
    } else {
      this.selectItem.emit(this.item);
    }

    const queryParams = this.route.snapshot.queryParams;

    const propertyCode =
      queryParams[RouteKeyQueryParams.hotelCode]?.toUpperCase() ?? '';
    const currency =
      queryParams[RouteKeyQueryParams.currency]?.toUpperCase() ?? '';
    const coupon = queryParams[RouteKeyQueryParams.promoCode] ?? '';

    this.googleTrackingService.pushGoogleTrackingEvent(
      propertyCode,
      GoogleTrackingEvents.viewItemList,
      {
        item_list_id: this.item?.tag,
        item_list_name: this.getLabelName(this.item?.tag),
        items: this.item?.rfcRatePlanList?.map((option, index) => ({
          index,
          item_id: this.item?.baseOption?.availableRfcList?.[0]?.code,
          item_name: this.item?.baseOption?.availableRfcList?.[0]?.name,
          item_brand: this.configService.hotel$.value?.name,
          item_category: 'Room',
          item_category2: 'Hotel',
          item_variant: option?.ratePlan?.name,
          quantity: this.bookingDuration,
          price: Number(option?.averageDailyRate?.toFixed(2)),
          currency: currency?.toUpperCase() ?? '',
          coupon: coupon ?? '',
          discount: null
        }))
      }
    );
  }

  private getLabelName(tag: string): string {
    switch (tag) {
      case BookingFlow.LowestPrice:
        return 'Lowest Price Option List';
      case BookingFlow.MostPopular:
        return 'Most Popular Option List';
      case BookingFlow.Recommended:
        return 'Our Tip Option List';
      case BookingFlow.Direct:
        return 'Default Option List';
      case BookingFlow.Match:
        return 'Matching Option List';
      default:
        return '';
    }
  }

  onTrack(): void {
    const objItem = this.getObjSelectOptionTrackMixPanel(this.item);
    this.trackingService.track(MixpanelKeys.SelectSearchOption, objItem);
    this.selectItem.emit({
      item: this.item,
      isOpenDetail: true,
      view: 'single-option'
    });
  }

  getObjSelectOptionTrackMixPanel(item: IOptionItem) {
    return {
      request_id:
        this.route.snapshot.queryParams[RouteKeyQueryParams.requestId],
      recommendation_id: item?.baseOption['stayOptionUuid'],
      booking_flow: item?.baseOption?.label,
      available_rfc_list: item?.baseOption?.availableRfcList
        ?.map((i) => i?.code)
        ?.join(','),
      available_rfc_rate_plan_list: item?.baseOption?.availableRfcRatePlanList
        ?.map((i) => i?.code)
        ?.join(','),
      product_feature:
        (item?.baseOption?.label !== 'MATCH' &&
          item?.baseOption?.availableRfcList?.map((i) => {
            return i?.retailFeatureList?.map((el) => el?.code)?.join(',');
          })) ||
        [],
      guarantee_feature:
        (item?.baseOption?.label === 'MATCH' &&
          item?.baseOption?.availableRfcList?.map((i) => {
            return i?.retailFeatureList
              ?.map((el) => `${el?.code}#${el?.matched ? 1 : 0}`)
              ?.join(',');
          })) ||
        []
    };
  }

  changeDate(): void {
    const [from, to] =
      this.bookingTransactionService.directLinkSelectedDate$?.value;
    this.bookingTransactionService.dateSelected$.next({
      from: (from && format(from, 'dd-MM-yyyy')) || null,
      to: (to && format(to, 'dd-MM-yyyy')) || null
    });

    this.bookingTransactionService.updateQueryParams();

    setTimeout(() => {
      this.suggestionHandlerService.loadAvailableStayOptions();
    }, 200);
  }

  zoomIn(imgUrls: string[], isNoFeatures: boolean) {
    this.dialog.open(ImageZoomableComponent, {
      maxWidth: '95vw',
      maxHeight: '80vh',
      panelClass: 'rounded-dialog',
      direction: this.direction(),
      data: {
        imgUrls: isNoFeatures ? [this.lowestPriceImageUrl] : imgUrls
      }
    });
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
        queryParams[RouteKeyQueryParams.promoCode],
      [RouteKeyQueryParams.customizeStay]:
        queryParams[RouteKeyQueryParams.customizeStay]
    };

    this.appRouterService.updateRouteQueryParams(prepareQueryParams, {
      navigateUrl: RouterPageKey.recommendation
    });
  }
}
