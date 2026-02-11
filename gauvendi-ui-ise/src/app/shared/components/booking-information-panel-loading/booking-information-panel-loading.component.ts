import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-information-panel-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-information-panel-loading.component.html',
  styleUrls: ['./booking-information-panel-loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingInformationPanelLoadingComponent {

}
