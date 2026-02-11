import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar-price-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-price-loading.component.html',
  styleUrls: ['./calendar-price-loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarPriceLoadingComponent {

}
