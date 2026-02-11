import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  signal
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import { HotelTaxSettingEnum } from '@app/core/graphql/generated/graphql';
import {
  EPriceView,
  PricingDisplayModeEnum
} from '@app/models/option-item.model';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import { selectorHotelRate } from '@app/store/hotel/hotel.selectors';
import { EDisplayMode } from '@models/display-mode.model';
import { Store } from '@ngrx/store';
import parse from 'date-fns/parse';
import { filter, map } from 'rxjs';
import { MyCurrencyPipe } from '../../utils/my-currency.pipe';

@Component({
  selector: 'app-option-price',
  standalone: true,
  imports: [CommonModule, CurrencyRatePipe, MyCurrencyPipe, TranslatePipe],
  templateUrl: './option-price.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionPriceComponent {
  private readonly configService = inject(HotelConfigService);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  @Input({ required: true }) price: number;
  @Input({ required: true }) priceView: EPriceView;
  @Input() adjustmentPercentage: number;
  @Input() childClass: string = '';
  @Input() displayMode: EDisplayMode = EDisplayMode.Grid;
  @Input() isBracket: boolean = false;
  @Input() isCombination: boolean = false;
  @Input() isDeal: boolean = false;
  @Input() isTextEnd: boolean = false;
  @Input() originalPrice: number;
  @Input() parentClass: string = '';
  @Input() rooms: number = 1;
  @Input() shouldShowStrikeThrough: boolean = false;
  @Input() showFrom: boolean = true;
  @Input() isStep2: boolean = false;
  @Input() fullPrice: number;

  EPriceView = EPriceView;

  currencyRate$ = this.store.select(selectorHotelRate);
  currencyCode$ = this.store.select(selectorCurrencyCodeSelected);
  isIncludedTax$ = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );
  isePricingDisplayMode$ = this.configService.isePricingDisplayMode$;
  pricingDisplayModeEnum = PricingDisplayModeEnum;
  showPricePerNight$ = this.route.queryParams.pipe(
    filter(
      (params) =>
        params[RouteKeyQueryParams.checkInDate] &&
        params[RouteKeyQueryParams.checkOutDate]
    ),
    map((params) => {
      const checkInDateParse = parse(
        params[RouteKeyQueryParams.checkInDate],
        'dd-MM-yyyy',
        new Date()
      );
      const checkOutDateParse = parse(
        params[RouteKeyQueryParams.checkOutDate],
        'dd-MM-yyyy',
        new Date()
      );

      const totalNight = Math.ceil(
        (checkOutDateParse.getTime() - checkInDateParse.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      this.totalNight.set(totalNight);

      return totalNight > 1;
    })
  );

  protected readonly EDisplayMode = EDisplayMode;
  totalNight = signal(0);
}
