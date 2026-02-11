import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from "@app/shared/pipes/translate.pipe";
import { Booking } from "@core/graphql/generated/graphql";
import { MappingPaymentCodePipe } from './pipes/mapping-payment-code.pipe';
import { MappingPaymentTypeIconPipe } from "./pipes/mapping-payment-type-icon.pipe";

@Component({
  selector: 'app-booking-payment-method',
  standalone: true,
  imports: [CommonModule, TranslatePipe, MappingPaymentCodePipe, MappingPaymentTypeIconPipe],
  templateUrl: './booking-payment-method.component.html',
  styleUrls: ['./booking-payment-method.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingPaymentMethodComponent {
  bookingInfo = input<Booking>();
}
