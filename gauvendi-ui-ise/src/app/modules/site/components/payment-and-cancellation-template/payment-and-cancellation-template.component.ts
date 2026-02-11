import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input
} from '@angular/core';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import { selectorHotelRate } from '@app/store/hotel/hotel.selectors';
import { select, Store } from '@ngrx/store';
import { MyCurrencyPipe } from '../../pages/recommendation/utils/my-currency.pipe';

@Component({
  selector: 'app-payment-and-cancellation-template',
  standalone: true,
  imports: [CommonModule, CurrencyRatePipe, TranslatePipe, MyCurrencyPipe],
  templateUrl: './payment-and-cancellation-template.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentAndCancellationTemplateComponent {
  private store = inject(Store);

  data = input<{
    payOnConfirmationAmount?: number;
    payAtHotelAmount?: number;
    payOnConfirmationDescription?: string;
    payAtHotelDescription?: string;
    cxlPolicyDescription?: string;
  }>(null);

  currencyCode$ = this.store.pipe(select(selectorCurrencyCodeSelected));
  currencyRate$ = this.store.pipe(select(selectorHotelRate));
}
