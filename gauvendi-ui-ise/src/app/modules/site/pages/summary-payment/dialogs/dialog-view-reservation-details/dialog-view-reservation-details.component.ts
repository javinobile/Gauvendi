import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { MEASURE_METRIC_KEY } from '@app/constants/localStorage.const';
import { OptionSwiperComponent } from '@app/modules/site/pages/recommendation/components/option-swiper/option-swiper.component';
import { DisplayIncludedServiceDescPipe } from '@app/modules/site/pages/recommendation/pipes/display-included-service-desc.pipe';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { GetCurrentRatePlanPipe } from '@app/modules/site/pages/summary-payment/pipes/get-current-rate-plan.pipe';
import { TotalAmenityPipe } from '@app/modules/site/pages/summary-payment/pipes/total-amenity.pipe';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { FeatureDescriptionTooltipDirective } from '@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { GetAmenityCountByAgePipe } from '@app/shared/pipes/get-amenity-count-by-age.pipe';
import { GetChildrenAgeIncludedPipe } from '@app/shared/pipes/get-children-age-included.pipe';
import { GetChildrenAgePipe } from '@app/shared/pipes/get-children-age.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  PricingUnitEnum,
  ReservationPricing
} from '@core/graphql/generated/graphql';
import { Store } from '@ngrx/store';
import { selectorRatePlanList } from '@store/suggestion/suggestion.selectors';
import { parse } from 'date-fns';

@Component({
  selector: 'app-dialog-view-reservation-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    TranslatePipe,
    FilterSvgDirective,
    FeatureDescriptionTooltipDirective,
    GetCurrentRatePlanPipe,
    DisplayIncludedServiceDescPipe,
    CurrencyRatePipe,
    MyCurrencyPipe,
    GetAmenityCountByAgePipe,
    GetChildrenAgeIncludedPipe,
    GetChildrenAgePipe,
    MyCurrencyPipe,
    TotalAmenityPipe,
    OptionSwiperComponent
  ],
  templateUrl: './dialog-view-reservation-details.component.html',
  styleUrl: './dialog-view-reservation-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogViewReservationDetailsComponent implements AfterViewInit {
  MAT_DIALOG_DATA: {
    item: ReservationPricing;
    index: number;
    isLowestPrice: boolean;
    currencyRate: number;
    currencyCode: string;
    lowestPriceImageUrl: string;
  } = inject(MAT_DIALOG_DATA);
  // dialogRef = inject(MatDialogRef<DialogViewReservationDetailsComponent>);
  hotelConfigService = inject(HotelConfigService);
  bookingTransactionService = inject(BookingTransactionService);
  store = inject(Store);
  route = inject(ActivatedRoute);

  secondaryTextColor$ = this.hotelConfigService.colorSecondaryText$;
  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;
  colorText$ = this.hotelConfigService.colorText$;
  ratePlanList$ = this.store.select(selectorRatePlanList);
  measureMetrics = localStorage.getItem(MEASURE_METRIC_KEY) || 'sqm';
  isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  viewport = signal(0);
  summary: {
    totalRoom: number;
    adult: number;
    children: number;
  } = this.bookingTransactionService.getTraveler(
    this.route.snapshot.queryParams[RouteKeyQueryParams.numberOfRoom]
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
  checkInDate =
    this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate];
  serviceIncluded =
    this.MAT_DIALOG_DATA.item?.roomProductSalesPlan?.ratePlan?.includedHotelExtrasList?.map(
      (x) => x?.code
    );
  pricingUnit = PricingUnitEnum;
  imgUrls = this.MAT_DIALOG_DATA.item?.roomProduct?.rfcImageList?.map(
    (x) => x?.imageUrl
  );

  ngAfterViewInit() {
    this.viewport.set(document.documentElement.clientHeight);
  }
}
