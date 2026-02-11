import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouterPageKey } from '@app/constants/RouteKey';
import { BrandingGuard } from '@app/guards/branding.guard';
import { ConfigGuard } from '@app/guards/config.guard';
import { HotelCodeValidationGuard } from '@app/guards/hotel-code-validation.guard';
import { InitGuard } from '@app/guards/init.guard';
import { ValidationGuard } from '@app/guards/validation.guard';
import { FooterComponent } from '@app/modules/site/components/footer/footer.component';
import { HeaderComponent } from '@app/modules/site/components/header/header.component';
import { ParseGauvendiLogoPipe } from '@app/shared/pipes/parse-gauvendi-logo.pipe';
import { MultiLangStateModule } from '@store/multi-lang/multi-lang-state.module';
import { SiteComponent } from './site.component';

const routes: Routes = [
  {
    path: '',
    component: SiteComponent,
    children: [
      {
        path: RouterPageKey.recommendation,
        loadComponent: () =>
          import('./pages/recommendation/recommendation.component').then(
            (c) => c.RecommendationComponent
          ),
        canActivate: [
          HotelCodeValidationGuard,
          BrandingGuard,
          ConfigGuard,
          ValidationGuard
        ]
      },
      {
        path: RouterPageKey.recommendationDetail,
        loadChildren: () =>
          import(
            './pages/recommendation-detail/recommendation-detail.module'
          ).then((m) => m.RecommendationDetailModule),
        canActivate: [HotelCodeValidationGuard, BrandingGuard, ConfigGuard]
      },
      {
        path: RouterPageKey.pickExtras,
        loadChildren: () =>
          import('./pages/pick-extras/pick-extras.module').then(
            (m) => m.PickExtrasModule
          ),
        canActivate: [HotelCodeValidationGuard, BrandingGuard, ConfigGuard]
      },
      {
        path: RouterPageKey.paymentResult,
        loadComponent: () =>
          import(
            './pages/booking-confirmation/booking-confirmation.component'
          ).then((c) => c.BookingConfirmationComponent),
        canActivate: [HotelCodeValidationGuard, BrandingGuard, ConfigGuard]
      },
      {
        path: RouterPageKey.bookingReview, // From CPP
        loadChildren: () =>
          import('./pages/booking-review/booking-review.module').then(
            (m) => m.BookingReviewModule
          ),
        canActivate: [HotelCodeValidationGuard, BrandingGuard, ConfigGuard]
      },
      {
        path: RouterPageKey.bookingProposal, // From CPP
        loadChildren: () =>
          import('./pages/booking-proposal/booking-proposal.module').then(
            (m) => m.BookingProposalModule
          ),
        canActivate: [HotelCodeValidationGuard, BrandingGuard, ConfigGuard]
      },
      {
        path: RouterPageKey.summaryPayment,
        loadChildren: () =>
          import('./pages/summary-payment/summary-payment.module').then(
            (m) => m.SummaryPaymentModule
          ),
        canActivate: [HotelCodeValidationGuard, BrandingGuard, ConfigGuard]
      },
      {
        path: RouterPageKey.bookingProcessing,
        loadChildren: () =>
          import('./pages/booking-processing/booking-processing.module').then(
            (m) => m.BookingProcessingModule
          ),
        canActivate: [HotelCodeValidationGuard, BrandingGuard, ConfigGuard]
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: RouterPageKey.recommendation
      },
      {
        path: ':hotelCode',
        loadComponent: () =>
          import('./pages/recommendation/recommendation.component').then(
            (c) => c.RecommendationComponent
          ),
        canActivate: [InitGuard]
      }
    ]
  }
];

@NgModule({
  declarations: [SiteComponent],
  imports: [
    CommonModule,
    FooterComponent,
    HeaderComponent,
    MultiLangStateModule,
    ParseGauvendiLogoPipe,
    RouterModule.forChild(routes)
  ]
})
export class SiteModule {}
