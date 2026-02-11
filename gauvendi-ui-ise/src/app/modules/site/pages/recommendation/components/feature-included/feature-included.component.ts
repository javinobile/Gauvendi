import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  input,
  Output,
  ViewChild
} from '@angular/core';
import { HotelRetailFeature } from '@app/core/graphql/generated/graphql';
import { EDisplayMode } from '@app/models/display-mode.model';
import { IFeature } from '@app/models/option-item.model';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { FeatureDescriptionTooltipDirective } from '@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LimitFeaturesDirective } from '../../pipes/limit-features.directive';
import {
  MatExpansionModule,
  MatExpansionPanel
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { ViewportService } from '@app/core/services/viewport.service';

@Component({
  selector: 'app-feature-included',
  standalone: true,
  templateUrl: './feature-included.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslatePipe,
    FilterSvgDirective,
    CustomTooltipModule,
    FeatureDescriptionTooltipDirective,
    LimitFeaturesDirective,
    MatExpansionModule,
    MatIcon
  ],
  styleUrls: ['./feature-included.component.scss']
})
export class FeatureIncludedComponent {
  readonly viewportService = inject(ViewportService);

  @ViewChild('featuresIncludedToggle')
  featuresIncludedToggle: MatExpansionPanel;
  @Input() displayMode: EDisplayMode = EDisplayMode.Grid;
  @Input() limitLine = 2;
  @Input() maxFeatureShowed: number = 5;
  @Input() isAlternativeOption = false;
  @Output() moreClicked = new EventEmitter();

  EDisplayMode = EDisplayMode;
  moreCount = 0;

  features = input<IFeature[]>([]);

  readonly isMobile$ = this.viewportService.isMobile$();
  displayedFeatures = computed(() =>
    this.features()?.filter(
      (feat) => !(feat?.metadata as HotelRetailFeature)?.code?.startsWith('SPT')
    )
  );

  increase(moreCount: number) {
    this.moreCount = moreCount;
    this.cd.detectChanges();
  }

  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;
  isMobile = false;

  constructor(
    private hotelConfigService: HotelConfigService,
    private cd: ChangeDetectorRef
  ) {
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
}
