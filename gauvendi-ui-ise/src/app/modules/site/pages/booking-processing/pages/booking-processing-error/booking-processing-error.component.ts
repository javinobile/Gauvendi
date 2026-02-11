import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams } from '@constants/RouteKey';

@Component({
  selector: 'app-booking-processing-error',
  standalone: true,
  imports: [AsyncPipe, TranslatePipe],
  templateUrl: './booking-processing-error.component.html',
  styleUrl: './booking-processing-error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingProcessingErrorComponent {
  route = inject(ActivatedRoute);

  backToHomePage(): void {
    window.open(
      `/${this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode]}`,
      '_self'
    );
  }
}
