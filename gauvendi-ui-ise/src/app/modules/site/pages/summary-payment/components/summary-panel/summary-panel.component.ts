import { AsyncPipe, CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Input,
  OnChanges,
  signal,
  SimpleChanges
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { AmenityCodeEnum } from '@app/constants/extras.const';
import { MEASURE_METRIC_KEY } from '@app/constants/localStorage.const';
import { SpaceTypeCategoryCode } from '@app/constants/space-type.const';
import { AbstractSpaceTypeComponent } from '@app/modules/site/components/abstracts/abstract-space-type.component';
import { ISPTFeature } from '@app/modules/site/components/abstracts/interfaces/abstract-space-type.interface';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { DialogRoomAndServiceImagesComponent } from '@app/modules/site/pages/summary-payment/dialogs/dialog-room-and-service-images/dialog-room-and-service-images.component';
import { GetCurrentRatePlanPipe } from '@app/modules/site/pages/summary-payment/pipes/get-current-rate-plan.pipe';
import { GetMatchingFeaturesPipe } from '@app/modules/site/pages/summary-payment/pipes/get-matching-features.pipe';
import { IsIncludedServicePipe } from '@app/modules/site/pages/summary-payment/pipes/is-included-service.pipe';
import { MaxFeaturesDisplayPipe } from '@app/modules/site/pages/summary-payment/pipes/max-features-display.pipe';
import { MaxServicesDisplayPipe } from '@app/modules/site/pages/summary-payment/pipes/max-services-display.pipe';
import { SortExtraServicesPipe } from '@app/modules/site/pages/summary-payment/pipes/sort-extra-services.pipe';
import { TotalAmenityPipe } from '@app/modules/site/pages/summary-payment/pipes/total-amenity.pipe';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { IOptionUnitsInfo } from '@app/shared/components/option-units-info/interfaces/option-units-info.interface';
import { OptionUnitsInfoComponent } from '@app/shared/components/option-units-info/option-units-info.component';
import { RoomSummaryLabelComponent } from '@app/shared/components/room-summary-label/room-summary-label.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { FeatureDescriptionTooltipDirective } from '@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { HideElementDirective } from '@app/shared/directives/hide-element.directive';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { DateWithLocalePipe } from '@app/shared/pipes/date-with-locale.pipe';
import { GetAmenityCountByAgePipe } from '@app/shared/pipes/get-amenity-count-by-age.pipe';
import { GetChildrenAgeIncludedPipe } from '@app/shared/pipes/get-children-age-included.pipe';
import { GetChildrenAgePipe } from '@app/shared/pipes/get-children-age.pipe';
import { GroupArrayPipe } from '@app/shared/pipes/group-array.pipe';
import { HexToRgbaPipe } from '@app/shared/pipes/hex-to-rgba.pipe';
import { MapCityTaxListPipe } from '@app/shared/pipes/map-city-tax-list.pipe';
import { ParseImageUrlPipe } from '@app/shared/pipes/parse-image-url.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  BookingFlow,
  BookingPricing,
  Country,
  HotelAmenity,
  PricingUnitEnum,
  ReservationPricing
} from '@core/graphql/generated/graphql';
import { selectorRatePlanList } from '@store/suggestion/suggestion.selectors';
import { differenceInCalendarDays, parse } from 'date-fns';
import { BookingTotalPaymentComponent } from '../booking-total-payment/booking-total-payment.component';

@Component({
  selector: 'app-summary-panel',
  standalone: true,
  imports: [
    BookingTotalPaymentComponent,
    CommonModule,
    CurrencyRatePipe,
    CustomTooltipModule,
    DateWithLocalePipe,
    FeatureDescriptionTooltipDirective,
    FilterSvgDirective,
    GetAmenityCountByAgePipe,
    GetChildrenAgeIncludedPipe,
    GetChildrenAgePipe,
    GetCurrentRatePlanPipe,
    GetMatchingFeaturesPipe,
    HexToRgbaPipe,
    IsIncludedServicePipe,
    MapCityTaxListPipe,
    MatDialogModule,
    MatExpansionModule,
    MatIcon,
    MaxFeaturesDisplayPipe,
    MaxServicesDisplayPipe,
    MyCurrencyPipe,
    ParseImageUrlPipe,
    SortExtraServicesPipe,
    TotalAmenityPipe,
    TranslatePipe,
    GroupArrayPipe,
    HideElementDirective,
    OptionUnitsInfoComponent,
    RoomSummaryLabelComponent,
    TranslatePipe
  ],
  templateUrl: './summary-panel.component.html',
  styleUrls: ['./summary-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AsyncPipe]
})
export class SummaryPanelComponent
  extends AbstractSpaceTypeComponent
  implements OnChanges
{
  @Input() availableAmenity: HotelAmenity[];
  @Input() bookingDuration: number;
  @Input() cancellationPolicy: string;
  @Input() colorPrimary: string;
  @Input() colorSecondaryText: string;
  @Input() colorText: string;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() hotelCountry: Country;
  @Input() hotelName: string;
  @Input() hotelTaxInformationSetting: { [key: string]: string };
  @Input() isCustomize: boolean;
  @Input() isHotelInclusive: boolean;
  @Input() isLowestPriceOpaque: boolean;
  @Input() locale: string;
  @Input() lowestPriceImageUrl: string;
  @Input() roomsConfigurationCode: string[];
  @Input() summaryBooking: BookingPricing;
  roomSummary = input<IOptionUnitsInfo>();

  expanseFeatures = false;
  expanseIncludeService = false;
  expanseExtraService = false;

  bookingTransactionService = inject(BookingTransactionService);
  dialog = inject(MatDialog);

  isMatchedFlow =
    this.route.snapshot.queryParams[RouteKeyQueryParams.bookingFlow] ===
    'MATCH';

  arrivalDate = parse(
    this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate],
    'dd-MM-yyyy',
    new Date()
  );
  departureDate = parse(
    this.route.snapshot.queryParams[RouteKeyQueryParams.checkOutDate],
    'dd-MM-yyyy',
    new Date()
  );
  totalNights = Math.abs(
    differenceInCalendarDays(this.arrivalDate, this.departureDate)
  );
  measureMetrics = localStorage.getItem(MEASURE_METRIC_KEY) || 'sqm';
  isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  openState = [];
  toggleRatePlanDescription = false;
  toggleProductDescription = false;
  summary: {
    totalRoom: number;
    adults: number;
    children: number;
  } = this.bookingTransactionService.getTraveler(
    this.route.snapshot.queryParams[RouteKeyQueryParams.numberOfRoom]
  );
  checkInDate =
    this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate];

  ratePlanList$ = this.store.select(selectorRatePlanList);

  roomUnitInfoConfigs = computed(() => this.setRoomUnitInfoConfig());
  summaryBooking$ = signal<BookingPricing>(null);
  spaceTypeCategoryCode = SpaceTypeCategoryCode;
  amenityCodeEnum = AmenityCodeEnum;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['summaryBooking']) {
      this.summaryBooking$.set(this.summaryBooking);
    }
  }

  override setSpaceTypeFeatures(): ISPTFeature[] {
    const features = this.summaryBooking$()
      ?.reservationPricingList?.map(
        (item) => item.roomProduct.retailFeatureList
      )
      .flat();
    if (!features?.length) return [];

    const mappedData = features
      .filter(
        (feature) =>
          feature.hotelRetailCategory?.code === SpaceTypeCategoryCode ||
          feature.code.startsWith(`${SpaceTypeCategoryCode}_`)
      )
      .map((item) => ({
        name: item.name,
        code: item.code,
        measurementUnit: item.measurementUnit
      }));

    return mappedData;
  }

  setRoomUnitInfoConfig(): IOptionUnitsInfo[] {
    const items = this.summaryBooking$()?.reservationPricingList;
    const stFeature = this.spaceTypeFeatures()[0];
    if (!items?.length) {
      return [];
    }

    return items.map((item) => ({
      adults: item?.adults,
      children: item?.childrenAgeList?.length,
      pets: item?.allocatedPets ?? 0,
      roomSpace: item?.roomProduct?.space,
      bedRooms: item?.roomProduct?.numberOfBedrooms,
      extraBeds:
        (item?.roomProduct?.allocatedExtraBedAdultCount || 0) +
        (item?.roomProduct?.allocatedExtraBedChildCount || 0),
      measurementUnit: stFeature?.measurementUnit,
      featureCode: stFeature?.code
    }));
  }

  expand(index: number): void {
    const newValue = [...this.openState, index];
    this.openState = [...new Set(newValue)];
  }

  collapse(index: number): void {
    this.openState = this.openState.filter((x) => x !== index);
  }

  openGallery(
    item: ReservationPricing,
    index: number,
    isLowestPrice: boolean
  ): void {
    this.dialog.open(DialogRoomAndServiceImagesComponent, {
      autoFocus: false,
      panelClass: 'rounded-dialog',
      data: {
        item,
        roomIndex: index,
        isLowestPrice,
        lowestPriceImageUrl: this.lowestPriceImageUrl
      }
    });
  }

  protected readonly bookingFlow = BookingFlow;
  protected readonly pricingUnit = PricingUnitEnum;
}
