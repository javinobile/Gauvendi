import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { map } from 'rxjs/operators';
import { AppRouterService } from '@app/services/app-router.service';
import { Store } from '@ngrx/store';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { PriceRangeFilterModule } from '@app/modules/site/pages/recommendation/directives/price-range-filter/price-range-filter.module';
import { EPriceView, ICombinationOptionItem } from '@models/option-item.model';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';

@Component({
  selector: 'app-price-range-desktop',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    PriceRangeFilterModule,
    FilterSvgDirective
  ],
  templateUrl: './price-range-desktop.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceRangeDesktopComponent implements OnChanges {
  @Input() stayOptionSuggestionList: ICombinationOptionItem[];
  @Input() priceState: EPriceView;
  @Input() currencyRate: number;
  @Input() currencyCode: string;
  isOpenPriceRange = true;
  priceStatePerNight$: Observable<boolean> = this.route.queryParams.pipe(
    map((x) => !x[RouteKeyQueryParams.priceState])
  );
  colorText$ = this.hotelConfigService.colorText$;

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private bookingTransactionService: BookingTransactionService,
    private appRouterService: AppRouterService,
    private hotelConfigService: HotelConfigService
  ) {}

  ngOnChanges({ stayOptionSuggestionList, currencyRate }: SimpleChanges) {
    if (
      (stayOptionSuggestionList || currencyRate) &&
      this.stayOptionSuggestionList
    ) {
      const results = this.stayOptionSuggestionList?.map((x) => x?.metadata);
      if (results?.length > 0) {
        const defaultPriceRangeFilter =
          this.bookingTransactionService.getPriceRangeFromResult(
            results,
            this.currencyRate,
            this.priceState
          );

        const { max, min } = defaultPriceRangeFilter;
        const queryParams = {
          ...this.route.snapshot.queryParams,
          [RouteKeyQueryParams.priceFilter]: `${min}-${max}`
        };
        this.appRouterService.updateRouteQueryParams(queryParams);
      }
    }
  }
}
