import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleTrackingEvents } from '@app/constants/datalayer.enum';
import { RouteKeyQueryParams, RouterPageKey } from '@app/constants/RouteKey';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { GetTaxInformationConfigByLocalePipe } from '@app/shared/pipes/get-tax-information-config-by-locale.pipe';
import { GetTaxInformationPipe } from '@app/shared/pipes/get-tax-information.pipe';
import { GetTaxNamePipe } from '@app/shared/pipes/get-tax-name.pipe';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  Country,
  HotelCityTax,
  HotelTax,
  ReservationPricing
} from '@core/graphql/generated/graphql';
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-booking-total-payment',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyRatePipe,
    GetTaxInformationConfigByLocalePipe,
    GetTaxInformationPipe,
    GetTaxNamePipe,
    MatIconModule,
    MyCurrencyPipe,
    TranslatePipe
  ],
  templateUrl: './booking-total-payment.component.html',
  styleUrls: ['./booking-total-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingTotalPaymentComponent implements OnChanges {
  @Input() bookingTaxList: HotelTax[];
  @Input() cancellationPolicy: string;
  @Input() cityTaxAmount: number;
  @Input() cityTaxList: HotelCityTax[];
  @Input() colorText: string;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() hotelCountry: Country;
  @Input() isInclusive: boolean;
  @Input() locale: string;
  @Input() payAtHotel: string;
  @Input() payAtHotelAmount: number;
  @Input() payAtHotelDescription: string;
  @Input() payOnConfirmation: string;
  @Input() payOnConfirmationAmount: number;
  @Input() payOnConfirmationDescription: string;
  @Input() serviceCharge: string;
  @Input() serviceChargeAmount: number;
  @Input() subTotalPrice: string;
  @Input() taxInformation: HotelCityTax[];
  @Input() taxInformationConfig: { [key: string]: string };
  @Input() totalPrice: string;
  @Input({ required: true }) reservationList: ReservationPricing[];
  @Input({ required: true }) totalGrossAmount: number;

  configService = inject(HotelConfigService);
  googleTrackingService = inject(GoogleTrackingService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  hotelCurrency = this.configService.hotel$.value?.baseCurrency?.code;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalPrice'] && this.totalPrice) {
      const queryParams = this.route.snapshot.queryParams;

      const propertyCode =
        queryParams[RouteKeyQueryParams.hotelCode]?.toUpperCase() ?? '';
      const currency = this.hotelCurrency?.toUpperCase() ?? '';
      const coupon = queryParams[RouteKeyQueryParams.promoCode] ?? '';

      const timezone = this.configService.hotelTimezone.value;

      const currentRoute = this.router.url;
      const isBeforeConfirmBooking = currentRoute?.includes(
        RouterPageKey.summaryPayment
      );
      if (!isBeforeConfirmBooking) {
        return;
      }

      this.googleTrackingService.pushGoogleTrackingEvent(
        propertyCode,
        GoogleTrackingEvents.beginCheckout,
        {
          currency,
          value: Number(this.totalGrossAmount?.toFixed(2)),
          coupon,
          items: this.reservationList?.map((res, index) => ({
            index,
            item_id: res?.roomProduct?.code,
            item_name: res?.roomProduct?.name,
            item_brand: this.configService.hotel$.value?.name,
            item_category: 'Room',
            item_category2: 'Hotel',
            item_variant: res?.roomProductSalesPlan?.ratePlan?.name,
            quantity: moment
              .tz(res?.departure, timezone)
              .startOf('days')
              .diff(moment.tz(res?.arrival, timezone).startOf('days'), 'days'),
            price: Number(res?.averageDailyRate?.toFixed(2)),
            currency,
            coupon: coupon ?? '',
            discount: null
          }))
        }
      );
    }
  }
}
