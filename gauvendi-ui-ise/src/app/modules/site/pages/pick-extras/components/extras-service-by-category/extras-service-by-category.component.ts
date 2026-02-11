import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { AmenityIncludedPipe } from '@app/modules/site/pages/pick-extras/pipes/amenity-included.pipe';
import { AmenitySelectedPipe } from '@app/modules/site/pages/pick-extras/pipes/amenity-selected.pipe';
import { SortByMandatoryPipe } from '@app/modules/site/pages/pick-extras/pipes/sort-by-mandatory.pipe';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import {
  selectorSearchMatchingRfc,
  selectorSurchargeAmenityList
} from '@app/store/pick-extras/pick-extras.selectors';
import { selectorRatePlanList } from '@app/store/suggestion/suggestion.selectors';
import { HotelAmenity } from '@core/graphql/generated/graphql';
import { select, Store } from '@ngrx/store';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { SwiperOptions } from 'swiper';
import { SwiperModule } from 'swiper/angular';
import { IsMandatoryServicePipe } from '../../pipes/is-mandatory-service.pipe';
import { ServiceItemComponent } from '../service-item/service-item.component';

@Component({
  selector: 'app-extras-service-by-category',
  standalone: true,
  imports: [
    AmenityIncludedPipe,
    AmenitySelectedPipe,
    CommonModule,
    CurrencyRatePipe,
    IsMandatoryServicePipe,
    MyCurrencyPipe,
    ServiceItemComponent,
    SwiperModule,
    SortByMandatoryPipe
  ],
  templateUrl: './extras-service-by-category.component.html',
  styleUrls: ['./extras-service-by-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExtrasServiceByCategoryComponent {
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() hotelAmenity: HotelAmenity[];
  @Input() includedHotelExtrasList: HotelAmenity[];
  @Input() index: number;
  @Input() isIncludedTax: boolean;
  @Input() roomServiceChain: string;
  @Input({ required: true }) category: string;

  @Output() changeAmount = new EventEmitter();
  @Output() toggleServices = new EventEmitter();

  surchargeAmenityList$ = this.store.pipe(
    select(selectorSurchargeAmenityList),
    distinctUntilChanged(
      (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
    )
  );

  progressValue = 0;

  config: SwiperOptions = {
    navigation: false,
    pagination: false,
    slidesPerView: 1.2,
    spaceBetween: 24,
    loop: false,
    breakpoints: {
      768: {
        slidesPerView: 2.3
      }
    }
  };

  mandatoryServiceIdList$ = combineLatest([
    this.store.pipe(
      select(selectorRatePlanList),
      distinctUntilChanged(
        (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
      )
    ),
    this.store.pipe(
      select(selectorSearchMatchingRfc),
      distinctUntilChanged(
        (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
      )
    )
  ]).pipe(
    map(([salesPlanList, selected]) => {
      if (salesPlanList?.length > 0 && selected) {
        const selectedSalesPlan = salesPlanList.find((item) => {
          const selectedCode =
            selected?.[this.index]?.rfcRatePlanList?.[0]?.ratePlan?.code;
          return item?.code === selectedCode;
        });
        if (selectedSalesPlan) {
          return selectedSalesPlan?.mandatoryHotelExtrasIdList;
        }
      }
      return [];
    })
  );

  constructor(
    private readonly cd: ChangeDetectorRef,
    private readonly store: Store
  ) {}

  onSlideChange(event): void {
    this.progressValue = +event?.['progress'];
    this.cd.detectChanges();
  }
}
