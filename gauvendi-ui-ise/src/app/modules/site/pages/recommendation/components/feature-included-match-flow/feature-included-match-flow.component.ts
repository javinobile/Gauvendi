import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  input,
  Output
} from '@angular/core';
import { HotelRetailFeature } from '@app/core/graphql/generated/graphql';
import { EDisplayMode } from '@app/models/display-mode.model';
import { IFeature } from '@app/models/option-item.model';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { FeatureDescriptionTooltipDirective } from '@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive';
import { FeatureTooltipDirective } from '@app/shared/directives/feature-tooltip/feature-tooltip.directive';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-feature-included-match-flow',
  standalone: true,
  templateUrl: './feature-included-match-flow.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslatePipe,
    FilterSvgDirective,
    CustomTooltipModule,
    FeatureDescriptionTooltipDirective,
    FeatureTooltipDirective
  ]
})
export class FeatureIncludedMatchFlowComponent {
  @Input() displayMode: EDisplayMode = EDisplayMode.Grid;
  @Input({ required: true }) matchFeatures: IFeature[];
  @Input({ required: true }) notMatchFeatures: IFeature[];
  @Input() maxFeatureShowed: number = 999;
  @Output() moreClicked = new EventEmitter();
  EDisplayMode = EDisplayMode;

  isMobile = false;
  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;
  colorText$ = this.hotelConfigService.colorText$;

  anotherFeatures = input<IFeature[]>([]);

  displayedAnotherFeatures = computed(() =>
    this.anotherFeatures().filter((feat) =>
      !(feat?.metadata as HotelRetailFeature)?.code?.startsWith('SPT')
    )
  );

  constructor(private hotelConfigService: HotelConfigService) {
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
}
