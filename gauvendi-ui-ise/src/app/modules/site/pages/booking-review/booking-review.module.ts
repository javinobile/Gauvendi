import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { bookingReviewGuard } from '@app/modules/site/pages/booking-review/guards/booking-review.guard';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () =>
          import('./pages/booking-review/booking-review.component').then(
            (m) => m.BookingReviewComponent
          ),
        canActivate: [bookingReviewGuard]
      }
    ])
  ]
})
export class BookingReviewModule {}
