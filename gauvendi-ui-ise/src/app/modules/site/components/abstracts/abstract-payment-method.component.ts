import {
  Component,
  ElementRef,
  inject,
  OnChanges,
  OnInit,
  Renderer2,
  signal,
  SimpleChanges
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '@app/apis/payment.service';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { TrackingService } from '@app/services/tracking.service';
import { MultiLangEnum } from '@app/store/multi-lang/multi-lang.state';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
@Component({
  template: ''
})
export abstract class AbstractPaymentMethodComponent
  implements OnChanges, OnInit
{
  protected fb = inject(FormBuilder);
  protected hotelConfigService = inject(HotelConfigService);
  protected renderer = inject(Renderer2);
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected paymentService = inject(PaymentService);
  protected trackingService = inject(TrackingService);
  protected googleTrackingService = inject(GoogleTrackingService);
  protected dialog = inject(MatDialog);
  protected elementRef = inject(ElementRef);

  validationErrorMessage$ = new BehaviorSubject<string>('');
  paymentErrorMessage$ = new BehaviorSubject<string>(null);
  paymentErrorMessageDraw$ = new BehaviorSubject<string>(null);
  isLockSubmitPayment$ = new BehaviorSubject(false);
  direction = signal<'rtl' | 'ltr'>('ltr');
  lang$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang]),
    distinctUntilChanged()
  );

  constructor() {
    this.lang$.subscribe((data) => {
      this.direction.set(data === MultiLangEnum.AR ? 'rtl' : 'ltr');
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {}
  ngOnInit(): void {}
}
