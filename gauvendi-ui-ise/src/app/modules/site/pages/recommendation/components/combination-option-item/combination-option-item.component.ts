import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GoogleTrackingEvents } from '@app/constants/datalayer.enum';
import { MEASURE_METRIC_KEY } from '@app/constants/localStorage.const';
import { SpaceTypeCategoryCode } from '@app/constants/space-type.const';
import {
  BookingFlow,
  HotelTaxSettingEnum,
  RfcRestriction
} from '@app/core/graphql/generated/graphql';
import { IRoomSummary } from '@app/models/common.model';
import { EDeviceType } from '@app/models/device.model';
import { EDisplayMode } from '@app/models/display-mode.model';
import {
  EPriceView,
  ICombinationOptionItem
} from '@app/models/option-item.model';
import { AbstractSpaceTypeComponent } from '@app/modules/site/components/abstracts/abstract-space-type.component';
import { ISPTFeature } from '@app/modules/site/components/abstracts/interfaces/abstract-space-type.interface';
import { FeatureIncludedMatchFlowComponent } from '@app/modules/site/pages/recommendation/components/feature-included-match-flow/feature-included-match-flow.component';
import { OptionItemDetailComponent } from '@app/modules/site/pages/recommendation/components/option-item-detail/option-item-detail.component';
import { CombinationHoverDirective } from '@app/modules/site/pages/recommendation/directives/combination-hover/combination-hover.directive';
import { CheckOptionPromotedPipe } from '@app/modules/site/pages/recommendation/pipes/check-option-promoted.pipe';
import { GetDealCodePipe } from '@app/modules/site/pages/recommendation/pipes/get-deal-code.pipe';
import { RenderCombinationTitlePipe } from '@app/modules/site/pages/recommendation/pipes/render-combination-title.pipe';
import { TagColorPipe } from '@app/modules/site/pages/recommendation/pipes/tag-color.pipe';
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
import { CalculateFullPriceWithTaxPipe } from '@app/shared/pipes/calculate-full-price-with-tax.pipe';
import { CalculatePriceWithTaxPipe } from '@app/shared/pipes/calculate-price-with-tax.pipe';
import { ParseImageUrlPipe } from '@app/shared/pipes/parse-image-url.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { SectionCodeEnum } from '@app/store/multi-lang/multi-lang.state';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { format, parse } from 'date-fns';
import { map } from 'rxjs/operators';
import { SwiperModule } from 'swiper/angular';
import { CalUnitCombinationOptionPricePipe } from '../../pipes/cal-unit-combination-option-price.pipe';
import { CombinationOptionCarouselItemStylePipe } from '../../pipes/combination-option-carousel-item-style.pipe';
import { FeatureIncludedComponent } from '../feature-included/feature-included.component';
import { MatchingPercentTagComponent } from '../matching-percent-tag/matching-percent-tag.component';
import { OptionItemTagComponent } from '../option-item-tag/option-item-tag.component';
import { OptionPriceComponent } from '../option-price/option-price.component';
import { OptionSwiperComponent } from '../option-swiper/option-swiper.component';
import { RfcRatePlanComponent } from '../rfc-rate-plan/rfc-rate-plan.component';
import { RoomRestrictionComponent } from '../room-restriction/room-restriction.component';
import { StandardFeaturesComponent } from '../standard-features/standard-features.component';

@Component({
  selector: 'app-combination-option-item',
  standalone: true,
  templateUrl: './combination-option-item.component.html',
  styleUrls: ['./combination-option-item.component.scss'],
  imports: [
    CalculatePriceWithTaxPipe,
    CalUnitCombinationOptionPricePipe,
    CheckOptionPromotedPipe,
    CombinationHoverDirective,
    CombinationOptionCarouselItemStylePipe,
    CommonModule,
    CustomTooltipModule,
    FeatureIncludedComponent,
    FeatureIncludedMatchFlowComponent,
    FilterSvgDirective,
    GetDealCodePipe,
    ImageCustomComponent,
    MatchingPercentTagComponent,
    MatDialogModule,
    OptionItemTagComponent,
    OptionPriceComponent,
    OptionSwiperComponent,
    OptionUnitsInfoComponent,
    ParseImageUrlPipe,
    RenderCombinationTitlePipe,
    RfcRatePlanComponent,
    RoomRestrictionComponent,
    StandardFeaturesComponent,
    SwiperModule,
    TagColorPipe,
    TranslatePipe,
    CalculateFullPriceWithTaxPipe
  ]
})
export class CombinationOptionItemComponent
  extends AbstractSpaceTypeComponent
  implements OnChanges, AfterViewInit
{
  @Input({ required: true }) displayMode: EDisplayMode;
  @Input({ required: true }) isLowestPriceOpaque: boolean;
  // @Input({ required: true }) item: ICombinationOptionItem;
  item = input.required<ICombinationOptionItem>();
  @Input({ required: true }) lowestPriceImageUrl: string;
  @Input({ required: true }) restrictionValidationList: RfcRestriction[];
  @Input() adultsFiltered: number;
  @Input() buttonTextColor: string;
  @Input() changeDateFromDirectOption: boolean = false;
  @Input() childrenFiltered: number;
  @Input() collapsed: boolean = false;
  @Input() isAlternativeOption = false;
  @Input() isDetails: boolean = false;
  @Input() isFromMatchingRfc: boolean = false;
  @Input() isHighLight = false;
  @Input() isSelected: boolean = false;
  @Input() priceView: EPriceView = EPriceView.PerStay;
  @Input() roomIdxView: number;
  @Input() showMatch: boolean = false;
  roomSummary = input<IRoomSummary>();

  @Output() selectItem = new EventEmitter();
  @Output() clear = new EventEmitter();
  @Output() selectRatePlan = new EventEmitter<string>();
  @Output() selectedIndex = new EventEmitter();

  @ViewChild('bottomEl', { static: false }) bottomEl: ElementRef;
  bottomBarHeight = signal(0);

  BookingFlow = BookingFlow;
  EDisplayMode = EDisplayMode;
  EPriceView = EPriceView;
  SectionCodeEnum = SectionCodeEnum;
  EDeviceType = EDeviceType;
  measureMetrics = localStorage.getItem(MEASURE_METRIC_KEY) || 'sqm';
  activeIndex = 0;
  isMobile = false;
  isMouseHover = false;
  tag = [
    BookingFlow.LowestPrice,
    BookingFlow.MostPopular,
    BookingFlow.Recommended
  ];

  includeTax$ = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );
  colorText$ = this.configService.colorText$;
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

  isSearchChanged = this.cartService.isSearchChanged;

  constructor(
    private bookingTransactionService: BookingTransactionService,
    private configService: HotelConfigService,
    private dialog: MatDialog,
    private suggestionHandlerService: SuggestionHandlerService,
    private trackingService: TrackingService,
    private readonly cartService: CartService
  ) {
    super();
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
  ngAfterViewInit(): void {
    if (this.bottomEl?.nativeElement) {
      this.bottomBarHeight.set(this.bottomEl?.nativeElement?.clientHeight);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('roomIdxView')) {
      this.activeIndex = this.roomIdxView;
    }

    if (this.displayMode && changes['displayMode']) {
      setTimeout(() => {
        if (this.bottomEl?.nativeElement) {
          this.bottomBarHeight.set(this.bottomEl?.nativeElement?.clientHeight);
        }
      }, 100);
    }
  }

  override setCombinationSpaceTypeFeatures(): ISPTFeature[][] {
    const combinationFeatures = this.item()?.items?.map(
      (item) => item.features
    );
    if (!combinationFeatures?.length) return [];

    const mapped = combinationFeatures.map((feature) =>
      feature
        .filter(
          (item) =>
            item.metadata.hotelRetailCategory?.code === SpaceTypeCategoryCode ||
            item.metadata.code.startsWith(`${SpaceTypeCategoryCode}_`)
        )
        .map((item) => {
          return { name: item.name, code: item.metadata?.code };
        })
    );

    return mapped;
  }

  viewDetail() {
    if (window.innerWidth < 1024) {
      this.onTrack();
    } else {
      this.selectItem.emit(this.item());
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
        item_list_id: this.item()?.tag,
        item_list_name: this.getLabelName(this.item()?.tag),
        items: this.item()?.items?.map((option, index) => ({
          index,
          item_id: option?.baseOption?.availableRfcList?.[0]?.code,
          item_name: option?.baseOption?.availableRfcList?.[0]?.name,
          item_brand: this.configService.hotel$.value?.name,
          item_category: 'Room',
          item_category2: 'Hotel',
          item_variant: option?.rfcRatePlan?.ratePlan?.name,
          quantity: this.bookingDuration,
          price: Number(option?.rfcRatePlan?.averageDailyRate?.toFixed(2)),
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
    const objItem = this.getObjSelectOptionTrackMixPanel(this.item());
    this.trackingService.track(MixpanelKeys.SelectSearchOption, objItem);
    this.selectItem.emit({
      item: this.item(),
      isOpenDetail: true,
      view: 'combination-option'
    });
  }

  getObjSelectOptionTrackMixPanel(item: ICombinationOptionItem) {
    return {
      request_id:
        this.route.snapshot.queryParams[RouteKeyQueryParams.requestId],
      recommendation_id: item?.metadata['stayOptionUuid'],
      booking_flow: item?.metadata?.label,
      available_rfc_list: item?.metadata?.availableRfcList
        ?.map((i) => i?.code)
        ?.join(','),
      available_rfc_rate_plan_list: item?.metadata?.availableRfcRatePlanList
        ?.map((i) => i?.code)
        ?.join(','),
      product_feature:
        (item?.metadata?.label !== 'MATCH' &&
          item?.metadata?.availableRfcList?.map((i) => {
            return i?.retailFeatureList?.map((el) => el?.code)?.join(',');
          })) ||
        [],
      guarantee_feature:
        (item?.metadata?.label === 'MATCH' &&
          item?.metadata?.availableRfcList?.map((i) => {
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

  setActiveIndex(index: number): void {
    this.activeIndex = index;
    this.selectedIndex.emit(this.activeIndex);
  }

  protected readonly OptionItemDetailComponent = OptionItemDetailComponent;

  zoomIn(imgUrls: string[], isNoFeatures: boolean) {
    this.dialog.open(ImageZoomableComponent, {
      maxWidth: '95vw',
      maxHeight: '80vh',
      panelClass: 'rounded-dialog',
      data: {
        imgUrls: isNoFeatures ? [this.lowestPriceImageUrl] : imgUrls
      }
    });
  }
}
