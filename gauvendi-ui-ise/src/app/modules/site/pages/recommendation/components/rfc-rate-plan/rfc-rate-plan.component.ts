import { AsyncPipe, CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GoogleTrackingEvents } from '@app/constants/datalayer.enum';
import { AmenityCodeEnum } from '@app/constants/extras.const';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import {
  RatePlan,
  Rfc,
  RfcRatePlan
} from '@app/core/graphql/generated/graphql';
import { EPriceView } from '@app/models/option-item.model';
import { SalePlanDetailModalComponent } from '@app/modules/site/components/sale-plan-detail-modal/sale-plan-detail-modal.component';
import { GetRatePlanDescriptionPipe } from '@app/modules/site/pages/recommendation/pipes/get-rate-plan-description.pipe';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { CalculateFullPriceWithTaxPipe } from '@app/shared/pipes/calculate-full-price-with-tax.pipe';
import { CalculatePriceWithTaxPipe } from '@app/shared/pipes/calculate-price-with-tax.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorRatePlanList } from '@app/store/suggestion/suggestion.selectors';
import { Scroller } from '@app/utils/scroller.util';
import { EDisplayMode } from '@models/display-mode.model';
import { Store } from '@ngrx/store';
import { parse } from 'date-fns';
import { shareReplay } from 'rxjs/operators';
import { DisplayIncludedServiceDescPipe } from '../../pipes/display-included-service-desc.pipe';
import { GetCxlPolicyPipe } from '../../pipes/get-cxl-policy.pipe';
import { GetPaymentTermPipe } from '../../pipes/get-payment-term.pipe';
import { StripHtmlPipe } from '../../pipes/strip-html.pipe';
import { OptionPriceComponent } from '../option-price/option-price.component';

@Component({
  selector: 'app-rfc-rate-plan',
  standalone: true,
  templateUrl: './rfc-rate-plan.component.html',
  styleUrls: ['./rfc-rate-plan.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalculatePriceWithTaxPipe,
    CommonModule,
    DisplayIncludedServiceDescPipe,
    FilterSvgDirective,
    GetCxlPolicyPipe,
    GetPaymentTermPipe,
    GetRatePlanDescriptionPipe,
    OptionPriceComponent,
    StripHtmlPipe,
    TranslatePipe,
    CalculateFullPriceWithTaxPipe
  ],
  providers: [AsyncPipe]
})
export class RfcRatePlanComponent
  extends DirSettingDirective
  implements AfterViewChecked
{
  private bookingTransactionService = inject(BookingTransactionService);
  private store = inject(Store);
  private hotelConfigService = inject(HotelConfigService);
  private cd = inject(ChangeDetectorRef);
  private readonly commonService = inject(CommonService);
  private googleTrackingService = inject(GoogleTrackingService);
  private asyncPipe = inject(AsyncPipe);

  @Input() dealCode: string;
  @Input() displayMode: EDisplayMode = EDisplayMode.Grid;
  @Input() isBook: boolean;
  @Input() isCombination: boolean = false;
  @Input() isFromMatchingRfc: boolean = false;
  @Input() isIncludedTax: boolean;
  @Input() isStep2 = false;
  @Input() name: string;
  @Input() promoCode: string;
  @Input() rooms: number = 1;
  @Input() step2CompactMode = false;
  @Input({ required: true }) bedRooms: number;
  @Input({ required: true }) item: RfcRatePlan;
  @Input({ required: true }) priceView: EPriceView;
  @Input({ required: true }) roomProduct: Rfc;

  @Output() selectRatePlan = new EventEmitter();

  dialog = inject(MatDialog);
  EPriceView = EPriceView;

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
  isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  ratePlanList$ = this.store.select(selectorRatePlanList);
  hotelPrimaryColor$ =
    this.hotelConfigService.hotelPrimaryColor$.pipe(shareReplay());
  buttonTextColor$ = this.hotelConfigService.buttonTextColor$;
  selectedRoomSummary$ = this.commonService.selectedRoomSummary.asObservable();
  amenityCodeEnum = AmenityCodeEnum;
  roomSummary$ = this.commonService.roomSummary$;

  constructor() {
    super();
  }

  navigateToPickExtras(ratePlanCode: string): void {
    this.selectRatePlan.emit(ratePlanCode);

    const queryParams = this.route.snapshot.queryParams;

    const propertyCode =
      queryParams[RouteKeyQueryParams.hotelCode]?.toUpperCase() ?? '';
    const currency =
      queryParams[RouteKeyQueryParams.currency]?.toUpperCase() ?? '';

    const coupon = queryParams[RouteKeyQueryParams.promoCode] ?? '';

    this.googleTrackingService.pushGoogleTrackingEvent(
      propertyCode,
      GoogleTrackingEvents.viewItem,
      {
        currency,
        value: Number(),
        items: [
          {
            index: 0,
            item_id: this.roomProduct?.code,
            item_name: this.roomProduct?.name,
            item_brand: this.hotelConfigService.hotel$.value?.name,
            item_category: 'Room',
            item_category2: 'Hotel',
            item_variant: this.item?.ratePlan?.name,
            quantity: this.bookingDuration,
            price: Number(this.item?.averageDailyRate?.toFixed(2)),
            currency: currency?.toUpperCase() ?? '',
            coupon: coupon ?? '',
            discount: null
          }
        ]
      }
    );
  }

  addService(): void {
    const isMobile =
      /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    Scroller.scrollToTargetElement(
      'anchor',
      undefined,
      isMobile ? 'center' : 'start'
    );
  }

  viewSalePlanDetail(ratePlanList: RatePlan[], code: string) {
    const selectedRatePlan = ratePlanList?.find((x) => x?.code === code);
    this.commonService.selectedRoomSummary.next(
      this.asyncPipe.transform(this.roomSummary$)
    );
    this.dialog
      .open(SalePlanDetailModalComponent, {
        maxWidth: '95vw',
        maxHeight: this.isMobile ? 'unset' : 'unset',
        minHeight: this.isMobile ? '100%' : 'unset',
        minWidth: this.isMobile ? '100vw' : 'unset',
        panelClass: 'rounded-dialog',
        autoFocus: false,
        direction: this.direction(),
        data: {
          selectedRatePlan,
          item: this.item,
          summary: this.commonService.selectedRoomSummary.value,
          bedRooms: this.bedRooms,
          bookingDuration: this.bookingDuration,
          checkInDate: this.checkInDate,
          name: this.name,
          isCombination: this.rooms > 1,
          isIncludedTax: this.isIncludedTax,
          isBook: this.isBook
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.result === 'YES') {
          this.selectRatePlan.emit(selectedRatePlan?.code);
        }
      });
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }

  ngAfterViewChecked() {
    this.cd.detectChanges();
  }
}
