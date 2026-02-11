import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { ImageHoveringComponent } from '@app/shared/components/image-hovering/image-hovering.component';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';

@Component({
  selector: 'app-feature-retail-item',
  standalone: true,
  imports: [CommonModule, FilterSvgDirective, ImageHoveringComponent],
  templateUrl: './feature-retail-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureRetailItemComponent {
  @Input() title: string;
  @Input() description: string;
  @Input() image: string;
  @Input() isSelected: boolean;
  @Input() isSpecial: boolean;
  @Input() featureDefaultIcon: string;
  @Input() featureHoverIcon: string;
  @Input() hotelPrimaryColor: string;
  @Output() toggleItem = new EventEmitter();
}
