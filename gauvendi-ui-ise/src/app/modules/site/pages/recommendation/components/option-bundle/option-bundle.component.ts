import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges
} from '@angular/core';
import {
  BookingFlow,
  HotelTaxSettingEnum
} from '@app/core/graphql/generated/graphql';
import { EDisplayMode } from '@app/models/display-mode.model';
import {
  EPriceView,
  IBundleItem,
  ICombinationOptionItem
} from '@app/models/option-item.model';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { CalculatePriceWithTaxPipe } from '@app/shared/pipes/calculate-price-with-tax.pipe';
import { selectorRatePlanList } from '@app/store/suggestion/suggestion.selectors';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';

import { IOptionUnitsInfo } from '@app/shared/components/option-units-info/interfaces/option-units-info.interface';
import { OptionUnitsInfoComponent } from '@app/shared/components/option-units-info/option-units-info.component';
import { GetCxlPolicyPipe } from '../../pipes/get-cxl-policy.pipe';
import { GetPaymentTermPipe } from '../../pipes/get-payment-term.pipe';
import { GetRatePlanDescriptionPipe } from '../../pipes/get-rate-plan-description.pipe';
import { StripHtmlPipe } from '../../pipes/strip-html.pipe';
import { OptionItemTagComponent } from '../option-item-tag/option-item-tag.component';
import { OptionPriceComponent } from '../option-price/option-price.component';
import { OptionSwiperComponent } from '../option-swiper/option-swiper.component';
import { CalculateFullPriceWithTaxPipe } from "@app/shared/pipes/calculate-full-price-with-tax.pipe";

@Component({
  selector: 'app-option-bundle',
  standalone: true,
  templateUrl: './option-bundle.component.html',
  styleUrls: [`./option-bundle.component.scss`],
  imports: [
    CommonModule,
    OptionItemTagComponent,
    OptionSwiperComponent,
    OptionUnitsInfoComponent,
    OptionPriceComponent,
    CalculatePriceWithTaxPipe,
    GetPaymentTermPipe,
    GetCxlPolicyPipe,
    GetRatePlanDescriptionPipe,
    StripHtmlPipe,
    CalculateFullPriceWithTaxPipe
]
})
export class OptionBundleComponent
  extends DirSettingDirective
  implements OnChanges
{
  @Input() bundle: IBundleItem;
  @Input() displayMode: EDisplayMode = EDisplayMode.Grid;
  @Input() isCollapsed = false;
  @Input() isDetailsView = false;
  @Input() isSelected = false;
  @Input() priceView: EPriceView = EPriceView.PerStay;

  @Output() clear = new EventEmitter();
  @Output() selectProduct = new EventEmitter();
  @Output() selectRatePlan = new EventEmitter();

  readonly bookingFlow = BookingFlow;
  readonly eDisplayMode = EDisplayMode;
  readonly ePriceView = EPriceView;

  ratePlanList$ = this.store.select(selectorRatePlanList);

  includeTax$ = this.configService.isePricingDisplayConfig$.pipe(
    map((mode) => mode === HotelTaxSettingEnum.Inclusive)
  );

  imageUrls = ['assets/beta/bundle_1.png', 'assets/beta/bundle_2.png'];

  lowestBundleItem: ICombinationOptionItem;
  unitsInfoItem = signal<IOptionUnitsInfo>(null);

  constructor(
    private readonly configService: HotelConfigService,
    private readonly store: Store
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.bundle) {
      // this.imageUrls = this.bundle.items
      //   ?.flatMap((item) => item?.items)
      //   ?.flatMap((item) => item?.imgUrls);
      this.lowestBundleItem = this.bundle?.items?.sort((prev, next) =>
        prev?.metadata?.availableRfcRatePlanList?.[0]?.totalGrossAmount <
        next?.metadata?.availableRfcRatePlanList?.[0]?.totalGrossAmount
          ? -1
          : 1
      )?.[0];
      this.setUnitsInfoItem();
    }
  }

  setUnitsInfoItem() {
    this.unitsInfoItem.set({
      adults: this.lowestBundleItem?.adults,
      children: this.lowestBundleItem?.children,
      roomKey: this.lowestBundleItem?.roomKey,
      pets: this.lowestBundleItem.pets,
      bedRooms: this.lowestBundleItem?.items?.[0]?.bedRooms,
      roomSpace: this.lowestBundleItem?.items?.[0]?.roomSpace
    });
  }
}
