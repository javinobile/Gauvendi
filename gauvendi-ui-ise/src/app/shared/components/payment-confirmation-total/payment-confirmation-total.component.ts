import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { GetTaxInformationConfigByLocalePipe } from '@app/shared/pipes/get-tax-information-config-by-locale.pipe';
import { GetTaxInformationPipe } from '@app/shared/pipes/get-tax-information.pipe';
import { GetTaxNamePipe } from '@app/shared/pipes/get-tax-name.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  Country,
  HotelCityTax,
  HotelTax
} from '@core/graphql/generated/graphql';

@Component({
  selector: 'app-payment-confirmation-total',
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
  templateUrl: './payment-confirmation-total.component.html',
  styleUrls: ['./payment-confirmation-total.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentConfirmationTotalComponent {
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
}
