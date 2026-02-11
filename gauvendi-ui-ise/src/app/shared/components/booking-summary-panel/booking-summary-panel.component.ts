import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MEASURE_METRIC_KEY } from '@app/constants/localStorage.const';
import { SpaceTypeCategoryCode } from '@app/constants/space-type.const';
import { AbstractSpaceTypeComponent } from '@app/modules/site/components/abstracts/abstract-space-type.component';
import { ISPTFeature } from '@app/modules/site/components/abstracts/interfaces/abstract-space-type.interface';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { BookingTotalPaymentComponent } from '@app/modules/site/pages/summary-payment/components/booking-total-payment/booking-total-payment.component';
import { MaxFeaturesDisplayPipe } from '@app/modules/site/pages/summary-payment/pipes/max-features-display.pipe';
import { DialogRoomAndServiceImagesCppComponent } from '@app/shared/components/dialog-room-and-service-images-cpp/dialog-room-and-service-images-cpp.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { FeatureDescriptionTooltipDirective } from '@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { CalculateBookingNightPipe } from '@app/shared/pipes/calculate-booking-night.pipe';
import { CalculateReservationAmenityCountPipe } from '@app/shared/pipes/calculate-reservation-amenity-count.pipe';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { DateWithLocaleAndTimezonePipe } from '@app/shared/pipes/date-with-locale-and-timezone.pipe';
import { GetAmenitiesIncludedCppPipe } from '@app/shared/pipes/get-amenities-included-cpp.pipe';
import { GetAmenityTotalPricePipe } from '@app/shared/pipes/get-amenity-total-price.pipe';
import { GroupArrayPipe } from '@app/shared/pipes/group-array.pipe';
import { HexToRgbaPipe } from '@app/shared/pipes/hex-to-rgba.pipe';
import { IsServiceIncludedPipe } from '@app/shared/pipes/is-service-included.pipe';
import { MapCityTaxListPipe } from '@app/shared/pipes/map-city-tax-list.pipe';
import { ParseImageUrlPipe } from '@app/shared/pipes/parse-image-url.pipe';
import { SortAmenitiesCppPipe } from '@app/shared/pipes/sort-amenities-cpp.pipe';
import { TotalAmenityListPipe } from '@app/shared/pipes/total-amenity-list.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  Booking,
  BookingFlow,
  Country,
  PricingUnitEnum,
  Reservation
} from '@core/graphql/generated/graphql';
import { HideElementDirective } from '../../directives/hide-element.directive';
import { IOptionUnitsInfo } from '../option-units-info/interfaces/option-units-info.interface';
import { OptionUnitsInfoComponent } from '../option-units-info/option-units-info.component';
import { RoomSummaryLabelComponent } from '../room-summary-label/room-summary-label.component';

@Component({
  selector: 'app-booking-summary-panel',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    FilterSvgDirective,
    CalculateBookingNightPipe,
    CurrencyRatePipe,
    MyCurrencyPipe,
    MatExpansionPanel,
    MatIcon,
    MaxFeaturesDisplayPipe,
    ParseImageUrlPipe,
    DateWithLocaleAndTimezonePipe,
    TotalAmenityListPipe,
    CalculateReservationAmenityCountPipe,
    GetAmenityTotalPricePipe,
    IsServiceIncludedPipe,
    GetAmenitiesIncludedCppPipe,
    FormsModule,
    ReactiveFormsModule,
    SortAmenitiesCppPipe,
    FeatureDescriptionTooltipDirective,
    BookingTotalPaymentComponent,
    MapCityTaxListPipe,
    HexToRgbaPipe,
    HideElementDirective,
    RoomSummaryLabelComponent,
    OptionUnitsInfoComponent,
    GroupArrayPipe,
    CustomTooltipModule
  ],
  templateUrl: './booking-summary-panel.component.html',
  styleUrls: ['./booking-summary-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingSummaryPanelComponent
  extends AbstractSpaceTypeComponent
  implements OnChanges
{
  @Input() hotelName: string;
  @Input() bookingInformation: Booking;
  @Input() locale: string;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() isLowestPriceOpaque: boolean;
  @Input() lowestPriceImageUrl: string;
  @Input() colorText: string;
  @Input() colorPrimary: string;
  @Input() colorSecondaryText: string;
  @Input() timezone: string;
  @Input() isHideBookingSummary = false;
  @Input() isReadonlySpecialRequest = false;
  @Output() specialRequestChanged = new EventEmitter();

  @Input() cancellationPolicy: string;
  @Input() hotelCountry: Country;
  @Input() hotelTaxInformationSetting: { [key: string]: string };
  @Input() isHotelInclusive: boolean;

  fb = inject(FormBuilder);
  cd = inject(ChangeDetectorRef);
  dialog = inject(MatDialog);
  openState = [];
  toggleRatePlanDescription = false;
  toggleSpecialRequest = false;
  toggleProductDescription = false;
  measureMetrics = localStorage.getItem(MEASURE_METRIC_KEY) || 'sqm';
  isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  roomUnitInfos = computed(() => this.setRoomUnitInfos());
  spaceTypeCategoryCode = SpaceTypeCategoryCode;
  bookingInformation$ = signal<Booking>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bookingInformation']) {
      this.bookingInformation$.set(this.bookingInformation);
      this.setRoomUnitInfos();
    }
  }

  expand(index: number): void {
    const newValue = [...this.openState, index];
    this.openState = [...new Set(newValue)];
  }

  collapse(index: number): void {
    this.openState = this.openState.filter((x) => x !== index);
  }

  openGallery(item: Reservation, index: number, isLowestPrice: boolean): void {
    this.dialog.open(DialogRoomAndServiceImagesCppComponent, {
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

  protected readonly pricingUnit = PricingUnitEnum;
  protected readonly bookingFlow = BookingFlow;

  override setSpaceTypeFeatures(): ISPTFeature[] {
    const features = this.bookingInformation$()
      ?.reservationList?.map((item) => item.rfc.retailFeatureList)
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

  setRoomUnitInfos(): IOptionUnitsInfo[] {
    const items = this.bookingInformation$()?.reservationList;
    if (!items?.length) {
      return [];
    }

    const stFeature = this.spaceTypeFeatures()?.[0];

    return items.map((item) => {
      const extraBed =
        (item?.rfc?.allocatedExtraBedAdultCount || 0) +
        (item?.rfc?.allocatedExtraBedChildCount || 0);
      return {
        adults: item?.adult,
        children: item?.childrenAgeList?.length,
        pets: item?.pets ?? 0,
        bedRooms: item?.rfc?.numberOfBedrooms,
        roomSpace: item?.rfc?.space,
        extraBeds: extraBed,
        measurementUnit: stFeature?.measurementUnit,
        featureCode: stFeature?.code
      };
    });
  }
}
