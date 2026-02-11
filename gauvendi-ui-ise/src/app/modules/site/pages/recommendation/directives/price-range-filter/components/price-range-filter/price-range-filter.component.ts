import { animate, style, transition, trigger } from '@angular/animations';
import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';
import { PriceRangeFormComponent } from '@app/modules/site/pages/recommendation/components/price-range-form/price-range-form.component';
import { ICombinationOptionItem } from '@models/option-item.model';

@Component({
  selector: 'app-price-range-filter',
  standalone: true,
  imports: [CommonModule, PriceRangeFormComponent],
  templateUrl: './price-range-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [animate('500ms', style({ opacity: 0 }))])
    ])
  ]
})
export class PriceRangeFilterComponent {
  @Input() stayOptionSuggestionList: ICombinationOptionItem[];
  @Input() currencyRate: number;
  @Input() currencyCode: string;
  overlayRef: OverlayRef;

  closePanel(): void {
    this.overlayRef.detach();
  }
}
