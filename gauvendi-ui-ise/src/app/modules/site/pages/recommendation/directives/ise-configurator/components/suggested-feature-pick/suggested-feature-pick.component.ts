import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HotelRetailFeature } from '@core/graphql/generated/graphql';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';

@Component({
  selector: 'app-suggested-feature-pick',
  standalone: true,
  imports: [CommonModule, FilterSvgDirective],
  templateUrl: './suggested-feature-pick.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuggestedFeaturePickComponent {
  @Input() title: string;
  @Input() feature: HotelRetailFeature[];
  @Input() colorPrimary: string;
  @Output() selectedFeature = new EventEmitter();
}
