import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-information-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-information-loading.component.html',
  styleUrls: ['./booking-information-loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingInformationLoadingComponent {

}
