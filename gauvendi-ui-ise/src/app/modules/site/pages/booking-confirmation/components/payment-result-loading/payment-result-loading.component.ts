import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-result-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-result-loading.component.html',
  styleUrls: ['./payment-result-loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentResultLoadingComponent {}
