import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { bookingProposalGuard } from '@app/modules/site/pages/booking-proposal/guard/booking-proposal.guard';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: 'booking',
        loadComponent: () =>
          import(
            './pages/proposal-for-booking/proposal-for-booking.component'
          ).then((m) => m.ProposalForBookingComponent),
        canActivate: [bookingProposalGuard]
      },
      {
        path: 'expiration',
        loadComponent: () =>
          import(
            './pages/booking-proposal-expiration/booking-proposal-expiration.component'
          ).then((m) => m.BookingProposalExpirationComponent),
        canActivate: [bookingProposalGuard]
      },
      {
        path: 'declined',
        loadComponent: () =>
          import(
            './pages/booking-proposal-declined/booking-proposal-declined.component'
          ).then((m) => m.BookingProposalDeclinedComponent),
        canActivate: [bookingProposalGuard]
      },
      {
        path: '',
        redirectTo: 'booking',
        pathMatch: 'full'
      }
    ])
  ]
})
export class BookingProposalModule {}
