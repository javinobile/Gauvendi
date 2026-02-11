import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { PriceRangeFormComponent } from '@app/modules/site/pages/recommendation/components/price-range-form/price-range-form.component';
import { AppRouterService } from '@app/services/app-router.service';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { Store } from '@ngrx/store';
import { selectorIsInclusive } from '@store/hotel/hotel.selectors';
import { BehaviorSubject, combineLatest, of, tap } from 'rxjs';

@Component({
  selector: 'app-price-range-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslatePipe,
    PriceRangeFormComponent,
    ReactiveFormsModule
  ],
  templateUrl: './price-range-mobile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceRangeMobileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private appRouterService = inject(AppRouterService);
  private destroyRef = inject(DestroyRef);

  isOpen = false;
  data: any;
  value$ = new BehaviorSubject(null);
  overlayRef: OverlayRef;

  taxCtrl = new FormControl(false);

  taxDisplayDefault$ = combineLatest([
    of(this.route.snapshot.queryParams[RouteKeyQueryParams.includeTax] === '1'),
    this.store.select(selectorIsInclusive)
  ]).pipe(
    tap(([a, b]) => {
      this.taxCtrl.patchValue(a ? a : b);
    })
  );

  ngOnInit(): void {
    this.taxCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isToggle) => {
        setTimeout(() => {
          this.appRouterService.updateRouteQueryParams({
            ...this.route.snapshot.queryParams,
            [RouteKeyQueryParams.includeTax]: isToggle ? '1' : null
          });
        });
      });
    this.taxCtrl.setValue(
      this.route.snapshot.queryParams[RouteKeyQueryParams.includeTax] === '1'
    );
  }

  closePanel(): void {
    this.isOpen = false;
    setTimeout(() => {
      this.overlayRef.detach();
    }, 500);
  }
}
