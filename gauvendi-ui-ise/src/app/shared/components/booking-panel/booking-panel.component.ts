import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BookingDateComponent} from "@app/shared/components/booking-date/booking-date.component";
import {DateWithLocalePipe} from "@app/shared/pipes/date-with-locale.pipe";
import {TotalNightPipe} from "@app/shared/pipes/total-night.pipe";
import {Booking, HotelAmenity} from "@core/graphql/generated/graphql";
import {CalculateBookingNightPipe} from "@app/modules/payment-result/pipes/calculate-booking-night.pipe";
import {
  PaymentReservationDetailComponent
} from "@app/shared/components/payment-reservation-detail/payment-reservation-detail.component";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {FilterSvgDirective} from "@app/shared/directives/filter-svg.directive";
import {DateWithLocaleAndTimezonePipe} from "@app/modules/payment-result/pipes/date-with-locale-and-timezone.pipe";

@Component({
  selector: 'app-booking-panel',
  standalone: true,
  imports: [CommonModule, BookingDateComponent, DateWithLocalePipe, TotalNightPipe, CalculateBookingNightPipe, PaymentReservationDetailComponent, TranslatePipe, FilterSvgDirective, DateWithLocaleAndTimezonePipe],
  templateUrl: './booking-panel.component.html',
  styleUrls: ['./booking-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingPanelComponent {
  @Input() hotelName: string;
  @Input() bookingInformation: Booking;
  @Input() locale: string;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() availableAmenity: HotelAmenity[];
  @Input() isLowestPriceOpaque: boolean;
  @Input() lowestPriceImageUrl: string;
  @Input() ratePlanName: string;
  @Input() colorText: string;
  @Input() timezone: string;
}
