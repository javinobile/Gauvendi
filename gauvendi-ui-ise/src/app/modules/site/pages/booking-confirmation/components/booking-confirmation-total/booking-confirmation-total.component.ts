import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Country, HotelCityTax, HotelTax} from "@core/graphql/generated/graphql";
import {CurrencyRatePipe} from "@app/shared/pipes/currency-rate.pipe";
import {MatIconModule} from "@angular/material/icon";
import {MyCurrencyPipe} from "@app/modules/site/pages/recommendation/utils/my-currency.pipe";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {FilterSvgDirective} from "@app/shared/directives/filter-svg.directive";

@Component({
  selector: 'app-booking-confirmation-total',
  standalone: true,
  imports: [CommonModule, CurrencyRatePipe, MatIconModule, MyCurrencyPipe, TranslatePipe, FilterSvgDirective],
  templateUrl: './booking-confirmation-total.component.html',
  styleUrls: ['./booking-confirmation-total.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingConfirmationTotalComponent {
  @Input() isInclusive: boolean;
  @Input() subTotalPrice: string;
  @Input() totalPrice: string;
  @Input() serviceCharge: string;
  @Input() serviceChargeAmount: number;
  @Input() hotelCountry: Country;
  @Input() cityTaxList: HotelCityTax[];
  @Input() currencyRate: number;
  @Input() currencyCode: string;
  @Input() bookingTaxList: HotelTax[];
  @Input() payAtHotel: string;
  @Input() payAtHotelAmount: number;
  @Input() payOnConfirmation: string;
  @Input() payOnConfirmationAmount: number;
  @Input() payOnConfirmationDescription: string;
  @Input() payAtHotelDescription: string;
  @Input() colorText: string;
}
