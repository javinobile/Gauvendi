import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { GetAmenityRatePipe } from '@app/modules/site/pages/pick-extras/pipes/get-amenity-rate.pipe';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  BookingPricing,
  ReservationPricing
} from '@core/graphql/generated/graphql';
import { EPriceView } from '@models/option-item.model';
import { differenceInCalendarDays, parse } from 'date-fns';
import { Subject } from 'rxjs';

import { PricingDisplayPipe } from '../../pipes/pricing-display.pipe';

@Component({
  selector: 'app-total-price-section',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyRatePipe,
    GetAmenityRatePipe,
    MatIconModule,
    MyCurrencyPipe,
    PricingDisplayPipe,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './total-price-section.component.html',
  styleUrls: ['./total-price-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalPriceSectionComponent implements AfterViewInit, OnDestroy {
  @Input() calculatePayment: BookingPricing;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() hotelInclusive: boolean;
  @Input() includeTax: boolean;
  @Input() isCombinationRoom: boolean;
  @Input() isNextRoom: boolean;
  @Input() priceState: EPriceView;
  @Input() reservationByIndex: ReservationPricing;
  @Input() roomIdxView: number;
  @Input() roomName: string;

  @Output() goNextRoom = new EventEmitter();

  isBottom: boolean = false;
  observer: IntersectionObserver;
  arrivalDate = parse(
    this.route.snapshot.queryParams[RouteKeyQueryParams.checkInDate],
    'dd-MM-yyyy',
    new Date()
  );
  departureDate = parse(
    this.route.snapshot.queryParams[RouteKeyQueryParams.checkOutDate],
    'dd-MM-yyyy',
    new Date()
  );
  totalNights = Math.abs(
    differenceInCalendarDays(this.arrivalDate, this.departureDate)
  );
  protected readonly EPriceView = EPriceView;

  destroyed$ = new Subject();

  constructor(
    private readonly cd: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }

  ngAfterViewInit(): void {
    let options = {
      root: document.querySelector('#scrollArea'),
      rootMargin: '0px',
      threshold: 0.25
    };

    let callback = (entries, observer) => {
      entries.forEach((entry) => {
        this.isBottom = entry.isIntersecting;
        this.cd.detectChanges();
      });
    };

    this.observer = new IntersectionObserver(callback, options);
    const target = document.querySelector('app-footer');
    this.observer.observe(target);
  }

  completeBooking(): void {
    this.router
      .navigate([RouterPageKey.summaryPayment], {
        queryParams: this.route.snapshot.queryParams,
        queryParamsHandling: 'merge'
      })
      .then();
  }

  goToNextRoom(): void {
    this.goNextRoom.emit();
  }
}
