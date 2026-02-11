import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { AmenityCodeEnum } from '@app/constants/extras.const';
import { DisplayIncludedServiceDescPipe } from '@app/modules/site/pages/recommendation/pipes/display-included-service-desc.pipe';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { CalculatePriceWithTaxPipe } from '@app/shared/pipes/calculate-price-with-tax.pipe';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import { RatePlan, RfcRatePlan } from '@core/graphql/generated/graphql';
import { EPriceView } from '@models/option-item.model';
import { select, Store } from '@ngrx/store';
import { selectorHotelRate } from '@store/hotel/hotel.selectors';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-sale-plan-detail-modal',
  standalone: true,
  imports: [
    AsyncPipe,
    CalculatePriceWithTaxPipe,
    CurrencyRatePipe,
    DisplayIncludedServiceDescPipe,
    FilterSvgDirective,
    MatDialogModule,
    MyCurrencyPipe,
    MyCurrencyPipe,
    MyCurrencyPipe,
    NgForOf,
    NgIf,
    TranslatePipe
  ],
  templateUrl: './sale-plan-detail-modal.component.html',
  styleUrl: './sale-plan-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalePlanDetailModalComponent implements AfterViewInit {
  private commonService = inject(CommonService);

  data: {
    selectedRatePlan: RatePlan;
    item: RfcRatePlan;
    summary: {
      totalRoom: number;
      adult: number;
      children: number;
    };
    bedRooms: number;
    bookingDuration: number;
    checkInDate: string;
    name: string;
    isCombination: boolean;
    isIncludedTax: boolean;
    isBook: boolean;
  } = inject(MAT_DIALOG_DATA);
  hotelConfigService = inject(HotelConfigService);
  dialogRef = inject(MatDialogRef);
  store = inject(Store);
  hotelPrimaryColor$ =
    this.hotelConfigService.hotelPrimaryColor$.pipe(shareReplay());
  buttonTextColor$ =
    this.hotelConfigService.buttonTextColor$.pipe(shareReplay());
  buttonBgColor$ = this.hotelConfigService.buttonBgColor$.pipe(shareReplay());
  currencyRate$: Observable<number> = this.store.pipe(
    select(selectorHotelRate)
  );
  currencyCode$: Observable<string> = this.store.pipe(
    select(selectorCurrencyCodeSelected)
  );
  protected readonly EPriceView = EPriceView;
  protected readonly Math = Math;
  fixedPriceAdjustment = 0;
  isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  viewport = signal(0);

  roomSummary$ = this.commonService.selectedRoomSummary.asObservable();
  amenityCodeEnum = AmenityCodeEnum;

  constructor() {
    this.fixedPriceAdjustment = this.data?.isIncludedTax
      ? this.data.item?.totalGrossAmountBeforeAdjustment -
        this.data?.item?.totalGrossAmount
      : this.data.item?.totalBaseAmountBeforeAdjustment -
        this.data?.item?.totalBaseAmount;
  }

  submit() {
    this.dialogRef.close({ result: 'YES' });
  }

  ngAfterViewInit() {
    this.viewport.set(document.documentElement.clientHeight);
  }
}
