import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { paymentResultGuard } from '@app/guards/payment-result.guard';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: 'error',
        loadComponent: () =>
          import(
            './pages/booking-processing-error/booking-processing-error.component'
          ).then((c) => c.BookingProcessingErrorComponent)
      },
      {
        path: '',
        loadComponent: () =>
          import(
            './pages/booking-processing/booking-processing.component'
          ).then((c) => c.BookingProcessingComponent),
        canActivate: [paymentResultGuard]
      }
    ])
  ]
})
export class BookingProcessingModule {}
