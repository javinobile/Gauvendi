import { ChangeDetectionStrategy, Component, inject, Input, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HotelStandardFeature } from '@app/core/graphql/generated/graphql';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { FeatureDescriptionTooltipDirective } from '@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { ViewportService } from '@app/core/services/viewport.service';

@Component({
  selector: 'app-standard-features',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    FilterSvgDirective,
    CustomTooltipModule,
    FeatureDescriptionTooltipDirective,
    MatExpansionModule,
    MatIcon
  ],
  templateUrl: './standard-features.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./standard-features.component.scss']
})
export class StandardFeaturesComponent {
  readonly viewportService = inject(ViewportService);

  @ViewChild('standardFeaturesToggle')
  standardFeaturesToggle: MatExpansionPanel;

  @Input({ required: true }) standardFeatures: HotelStandardFeature[];
  @Input() maxFeatureShowed = 4;

  isMobile = false;
  readonly colorText$ = this.hotelConfigService.colorText$;
  readonly isMobile$ = this.viewportService.isMobile$();

  constructor(private hotelConfigService: HotelConfigService) {
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
}
