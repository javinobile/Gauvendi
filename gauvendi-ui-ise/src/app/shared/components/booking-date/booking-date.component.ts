import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {FilterSvgDirective} from "@app/shared/directives/filter-svg.directive";

@Component({
  selector: 'app-booking-date',
  standalone: true,
  imports: [CommonModule, TranslatePipe, FilterSvgDirective],
  templateUrl: './booking-date.component.html',
  styleUrls: ['./booking-date.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingDateComponent {
  @Input() totalNights: number;
  @Input() checkInDate: string;
  @Input() checkOutDate: string;
  @Input() colorText: string;
}
