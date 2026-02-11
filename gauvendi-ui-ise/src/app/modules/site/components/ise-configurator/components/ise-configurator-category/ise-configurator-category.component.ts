import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FeatureCountConfiguratorPipe } from '@app/modules/site/pages/recommendation/directives/ise-configurator/pipes/feature-count-configurator.pipe';
import { ImageHoveringComponent } from '@app/shared/components/image-hovering/image-hovering.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import {
  HotelRetailCategory,
  HotelRetailFeature
} from '@core/graphql/generated/graphql';

@Component({
  selector: 'app-ise-configurator-category',
  standalone: true,
  imports: [
    CustomTooltipModule,
    FeatureCountConfiguratorPipe,
    CommonModule,
    ImageHoveringComponent
  ],
  styles: `
    .hexagon {
      width: 100%;
      padding-bottom: 115.47%; /* Padding is calculated as 2 * (sqrt(3)/2 * width) */
      position: absolute;
      background-color: #fff; /* Change the color as needed */
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    }
  `,
  templateUrl: './ise-configurator-category.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IseConfiguratorCategoryComponent {
  @Input() hotelRetailCategoryList: HotelRetailCategory[];
  @Input() featureSelected: string[];
  @Input() categoryDefaultIconColor: string;
  @Input() categoryDefaultBgColor: string;
  @Input() categoryHoverIconColor: string;
  @Input() categoryHoverBgColor: string;
  @Input() colorButtonText: string;
  @Input() viewOnly: boolean = false;
  @Input() categorySelected: HotelRetailCategory;
  @Input() hotelRetailFeatureList: HotelRetailFeature[];
  @Output() selectCategory = new EventEmitter();
}
