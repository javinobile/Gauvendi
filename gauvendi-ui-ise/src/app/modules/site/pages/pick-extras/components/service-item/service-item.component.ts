import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GoogleTrackingEvents } from '@app/constants/datalayer.enum';
import { AmenityCodeEnum } from '@app/constants/extras.const';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { TrackingService } from '@app/services/tracking.service';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { NumericStepComponent } from '@app/shared/form-controls/numeric-step/numeric-step.component';
import { ParseImageUrlPipe } from '@app/shared/pipes/parse-image-url.pipe';
import { ParsePricingModelPipe } from '@app/shared/pipes/parse-pricing-model.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorSurchargeAmenityList } from '@app/store/pick-extras/pick-extras.selectors';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  HotelAmenity,
  HotelAmenityIsePricingDisplayMode,
  PricingUnitEnum
} from '@core/graphql/generated/graphql';
import { select, Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-service-item',
  standalone: true,
  imports: [
    CommonModule,
    CustomTooltipModule,
    FilterSvgDirective,
    NumericStepComponent,
    ReactiveFormsModule,
    TranslatePipe,
    FilterSvgDirective,
    NumericStepComponent,
    CustomTooltipModule,
    ParseImageUrlPipe,
    ParsePricingModelPipe
  ],
  templateUrl: './service-item.component.html',
  styleUrls: ['./service-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceItemComponent implements OnChanges {
  private hotelConfigService = inject(HotelConfigService);
  private route = inject(ActivatedRoute);
  private trackingService = inject(TrackingService);
  private store = inject(Store);
  private googleTrackingService = inject(GoogleTrackingService);

  @Input() amount: number;
  @Input() description: string;
  @Input() image: string;
  @Input() index: number;
  @Input() isIncluded: boolean;
  @Input() isMandatory: boolean;
  @Input() isSelected: boolean;
  @Input() price: string;
  @Input() title: string;
  @Input() unit: string;
  @Input({ required: true }) category: string;
  @Input({ required: true }) priceAmount: number;
  code = input.required<string>();

  @Output() changeAmount = new EventEmitter();
  @Output() toggleServices = new EventEmitter();

  readonly itemUnit = PricingUnitEnum;

  control: FormControl;
  customizeDescription: string;
  isMobile = false;

  outlineButtonText$ = this.hotelConfigService.outlineButtonText$;

  petSurchargeAmenity$: Observable<HotelAmenity> = this.store.pipe(
    select(selectorSurchargeAmenityList),
    map((list) => {
      const item = list?.find(
        (item) => item.code === AmenityCodeEnum.PET_SURCHARGE
      );

      this.isPetSurchargeAmenityExcluded.set(
        item?.isePricingDisplayMode ===
          HotelAmenityIsePricingDisplayMode.Excluded
      );

      return item || {};
    })
  );
  isPetSurchargeAmenityExcluded = signal(false);
  isPetSurchargeExcluded = computed(() => {
    return (
      this.code() === AmenityCodeEnum.PET_SURCHARGE &&
      this.isPetSurchargeAmenityExcluded()
    );
  });

  constructor() {
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.control = new FormControl(this.amount || 0);
    this.customizeDescription = this.description?.replace(/(\\\\n)/g, '\n');
  }

  handleToggle(type: 'Add' | 'Remove'): void {
    this.trackingService.track(
      type === 'Add' ? MixpanelKeys.AddExtra : MixpanelKeys.RemoveExtra,
      {
        name: 'Pick extras',
        service: this.title,
        service_price: this.price,
        booking_flow:
          this.route.snapshot.queryParams[RouteKeyQueryParams.bookingFlow]
      }
    );
    this.toggleServices.emit();

    const queryParams = this.route.snapshot.queryParams;

    const propertyCode =
      queryParams[RouteKeyQueryParams.hotelCode]?.toUpperCase() ?? '';
    const currency =
      queryParams[RouteKeyQueryParams.currency]?.toUpperCase() ?? '';

    this.googleTrackingService.pushGoogleTrackingEvent(
      propertyCode,
      GoogleTrackingEvents.selectItem,
      {
        item_list_id: 'EXTRAS',
        item_list_name: 'Extras List',
        items: [
          {
            index: this.index,
            item_id: this.code,
            item_name: this.title,
            item_brand: this.hotelConfigService.hotel$.value?.name,
            item_category: this.category,
            item_category2: this.getPricingUnitName(this.unit),
            item_variant: 'DEFAULT',
            quantity: type === 'Add' ? 1 : 0,
            price: Number(this.priceAmount?.toFixed(2)),
            currency,
            coupon: '',
            discount: null
          }
        ]
      }
    );
  }

  changeValue(): void {
    this.trackingService.track(MixpanelKeys.UpdateExtraQuantity, {
      name: 'Pick extras',
      quantity_from: this.amount,
      quantity_to: this.control.value,
      service: this.title,
      service_price: this.price,
      booking_flow:
        this.route.snapshot.queryParams[RouteKeyQueryParams.bookingFlow]
    });
    this.changeAmount.emit(this.control.value);

    const queryParams = this.route.snapshot.queryParams;

    const propertyCode =
      queryParams[RouteKeyQueryParams.hotelCode]?.toUpperCase() ?? '';
    const currency =
      queryParams[RouteKeyQueryParams.currency]?.toUpperCase() ?? '';

    this.googleTrackingService.pushGoogleTrackingEvent(
      propertyCode,
      GoogleTrackingEvents.selectItem,
      {
        item_list_id: 'EXTRAS',
        item_list_name: 'Extras List',
        items: [
          {
            index: this.index,
            item_id: this.code,
            item_name: this.title,
            item_brand: this.hotelConfigService.hotel$.value?.name,
            item_category: this.category,
            item_category2: this.getPricingUnitName(this.unit),
            item_variant: 'DEFAULT',
            quantity: this.control.value,
            price: Number(this.priceAmount?.toFixed(2)),
            currency,
            coupon: '',
            discount: null
          }
        ]
      }
    );
  }

  private getPricingUnitName(unit: string): string {
    switch (unit) {
      case PricingUnitEnum.Item:
        return 'Per Item';
      case PricingUnitEnum.Night:
        return 'Per Night';
      case PricingUnitEnum.PerPersonPerRoom:
        return 'Per Person';
      case PricingUnitEnum.Person:
        return 'Per Person / Night';
      case PricingUnitEnum.Room:
        return 'Per Stay';
      default:
        return '';
    }
  }
}
