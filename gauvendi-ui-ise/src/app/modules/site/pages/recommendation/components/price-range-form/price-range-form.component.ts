import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  effect,
  EventEmitter,
  inject,
  Input,
  input,
  Output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataLayerEvents, DataLayerKeys } from '@app/constants/datalayer.enum';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { TrackingService } from '@app/services/tracking.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { CustomRangeSliderComponent } from '@app/shared/form-controls/custom-range-slider/custom-range-slider.component';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { EPriceView, ICombinationOptionItem } from '@models/option-item.model';
import { RadioButtonItem } from '@models/radio-button.model';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

interface PriceRange {
  min: number;
  max: number;
}

@Component({
  selector: 'app-price-range-form',
  standalone: true,
  imports: [
    CommonModule,
    CustomRangeSliderComponent,
    FilterSvgDirective,
    MyCurrencyPipe,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './price-range-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceRangeFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly appRouterService = inject(AppRouterService);
  private readonly bookingTransactionService = inject(
    BookingTransactionService
  );
  private readonly googleTrackingService = inject(GoogleTrackingService);
  private readonly trackingService = inject(TrackingService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly hotelConfigService = inject(HotelConfigService);
  private readonly destroyRef = inject(DestroyRef);

  stayOptionSuggestionList = input<ICombinationOptionItem[]>();
  currencyRate = input<number>();
  currencyCode = input<string>();
  @Input() overlayRef: OverlayRef;
  @Output() close = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();

  readonly priceRangeFrm: FormGroup = this.fb.group({
    sliderRange: [{ max: null, min: null }],
    priceType: [0]
  });

  readonly allItems: RadioButtonItem[] = [
    { label: 'PER_NIGHT_PRICE', value: 0 },
    { label: 'PRICE_PER_STAY', value: 1 }
  ];

  defaultPriceRangeFilter: PriceRange | null = null;
  readonly priceView$ = new BehaviorSubject<EPriceView>(null);
  readonly colorText$ = this.hotelConfigService.colorText$;
  value$ = new BehaviorSubject(null);
  isOpen: boolean;

  constructor() {
    effect(() => {
      if (!this.stayOptionSuggestionList()) {
        return;
      }

      this.initializePriceType();
      this.initializePriceRange();
      this.setMaxMinPriceRange();
      this.subscribeToPriceTypeChanges();
    });
  }

  private initializePriceType(): void {
    const priceType =
      this.route.snapshot.queryParams[RouteKeyQueryParams.priceState];
    const priceView = +priceType ? EPriceView.PerStay : EPriceView.PerNight;

    this.priceView$.next(priceView);
    this.priceRangeFrm.patchValue({ priceType: +priceType ? 1 : 0 });
  }

  private initializePriceRange(): void {
    const priceRoute =
      this.route.snapshot.queryParams[RouteKeyQueryParams.priceFilter];
    if (!priceRoute) {
      return;
    }

    const [min, max] = priceRoute.split('-').map(Number);
    this.priceRangeFrm.patchValue({
      sliderRange: { min, max }
    });
    this.cd.detectChanges();
  }

  private subscribeToPriceTypeChanges(): void {
    this.priceRangeFrm
      .get('priceType')
      .valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged()
      )
      .subscribe(this.handlePriceTypeChange.bind(this));
  }

  private handlePriceTypeChange(val: number): void {
    const priceView = val ? EPriceView.PerStay : EPriceView.PerNight;
    this.priceView$.next(priceView);

    const defaultPriceRangeFilter = this.getPriceRangeFromMetadata();
    this.updatePriceRangeFilter(defaultPriceRangeFilter);
  }

  private getPriceRangeFromMetadata(): PriceRange {
    return this.bookingTransactionService.getPriceRangeFromResult(
      this.stayOptionSuggestionList().map((x) => x?.metadata),
      this.currencyRate(),
      this.priceView$.value
    );
  }

  private updatePriceRangeFilter(priceRange: PriceRange): void {
    this.defaultPriceRangeFilter = priceRange;
    const { min, max } = this.priceRangeFrm?.value.sliderRange;

    const isNill = (value) => {
      return value === null || value === undefined;
    };

    if (isNill(min) || isNill(max)) {
      this.priceRangeFrm.patchValue({
        sliderRange: {
          min: priceRange.min,
          max: priceRange.max
        }
      });
    }
    this.cd.detectChanges();
  }

  setMaxMinPriceRange(): void {
    const priceRange = this.getPriceRangeFromMetadata();
    this.updatePriceRangeFilter(priceRange);
  }

  reset(): void {
    if (!this.defaultPriceRangeFilter) {
      return;
    }

    this.priceRangeFrm.patchValue({
      sliderRange: {
        min: this.defaultPriceRangeFilter.min,
        max: this.defaultPriceRangeFilter.max
      }
    });
    this.cd.detectChanges();
  }

  private pushEvent(priceRange: PriceRange): void {
    const hotelCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode];
    const { min, max } = priceRange;

    this.googleTrackingService.pushEvent(DataLayerEvents.filterByPriceRange, {
      [DataLayerKeys.priceFilter]:
        !isNaN(min) || isNaN(max) ? null : { min, max },
      [DataLayerKeys.currency]: this.currencyCode,
      [DataLayerKeys.hotelCode]: hotelCode?.toLocaleUpperCase()
    });

    this.trackingService.track(MixpanelKeys.UpdatePriceRange, {
      name: 'Select price range',
      currency: this.currencyCode,
      exchange_rate: this.currencyRate,
      price_max: max,
      price_min: min
    });
  }


  submit(): void {
    const { max, min } = this.priceRangeFrm.get('sliderRange').value;
    const priceType = this.priceRangeFrm.get('priceType').value;

    const queryParams = {
      ...this.route.snapshot.queryParams,
      [RouteKeyQueryParams.priceFilter]: `${min}-${max}`,
      [RouteKeyQueryParams.priceState]: priceType ? 1 : null
    };

    this.appRouterService.updateRouteQueryParams(queryParams);
    setTimeout(() => this.pushEvent({ min, max }), 200);

    this.close.emit();
    this.closeMobile.emit();
  }
}
