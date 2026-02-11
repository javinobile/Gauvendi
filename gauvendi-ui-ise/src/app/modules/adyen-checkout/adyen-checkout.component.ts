import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '@app/apis/payment.service';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import { PaymentProviderCodeEnum } from '@core/graphql/generated/graphql';

@Component({
  selector: 'app-adyen-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adyen-checkout.component.html',
  styleUrls: ['./adyen-checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdyenCheckoutComponent implements OnInit, OnDestroy {
  bookingId: string;
  redirectResult: string;
  hotelCode: string;
  language: string;
  currency: string;
  paymentProvider: string;
  recommendationId: string;
  requestId: string;

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.queryParams['bookingId'];
    this.redirectResult = this.route.snapshot.queryParams['redirectResult'];
    this.hotelCode = localStorage.getItem('hotelCode');
    this.language = localStorage.getItem('language');
    this.currency = localStorage.getItem('currency');
    this.paymentProvider = localStorage.getItem('paymentProvider');
    this.recommendationId = localStorage.getItem('recommendationId');
    this.requestId = localStorage.getItem('requestId');
    this.paymentService
      .completeBookingPayment({
        booking: {
          id: this.bookingId,
          hotelCode: this.hotelCode
        },
        paymentIntent: {
          id: this.redirectResult,
          paymentProviderCode: this.paymentProvider as PaymentProviderCodeEnum
        }
      })
      .subscribe(() => {
        this.router
          .navigate([RouterPageKey.bookingProcessing], {
            queryParams: {
              [RouteKeyQueryParams.currency]: this.currency,
              [RouteKeyQueryParams.hotelCode]: this.hotelCode,
              [RouteKeyQueryParams.lang]: this.language,
              [RouteKeyQueryParams.paymentId]: this.bookingId,
              [RouteKeyQueryParams.recommendationId]: this.recommendationId,
              [RouteKeyQueryParams.requestId]: this.requestId
            },
            queryParamsHandling: 'merge'
          })
          .then(() => window.location.reload());
      });
  }

  ngOnDestroy(): void {
    localStorage.removeItem('hotelCode');
    localStorage.removeItem('language');
    localStorage.removeItem('currency');
    localStorage.removeItem('paymentProvider');
    localStorage.removeItem('recommendationId');
    localStorage.removeItem('requestId');
  }
}
