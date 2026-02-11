import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener} from '@angular/core';
import {CommonModule} from '@angular/common';
import {OverlayRef} from "@angular/cdk/overlay";
import {HotelRetailFeature} from "@core/graphql/generated/graphql";
import {animate, style, transition, trigger} from "@angular/animations";
import {CustomTooltipModule} from "@app/shared/directives/custom-tooltip/custom-tooltip.module";
import {FilterSvgDirective} from "@app/shared/directives/filter-svg.directive";
import {HotelConfigService} from "@app/services/hotel-config.service";
import { IFeature } from '@app/models/option-item.model';

@Component({
  selector: 'app-feature-tooltip-content',
  standalone: true,
  imports: [CommonModule, CustomTooltipModule, FilterSvgDirective],
  templateUrl: './feature-tooltip-content.component.html',
  styleUrls: ['./feature-tooltip-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({opacity: 0}),
        animate('500ms', style({opacity: 1})),
      ]),
      transition(':leave', [
        animate('500ms', style({opacity: 0})),
      ]),
    ]),
  ],
})
export class FeatureTooltipContentComponent {
  content: IFeature[];
  maxWidth: string;
  isOtherFeature = false
  isAlternativeOption = false;

  overlayRef: OverlayRef;
  hotelPrimaryColor$ = this.hotelConfigService.hotelPrimaryColor$;
  colorText$ = this.hotelConfigService.colorText$;
  isMobile = false;

  constructor(
    private hotelConfigService: HotelConfigService,
    private cd: ChangeDetectorRef
  ) {
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  @HostListener('mouseleave')
  onMouseEnter() {
    this.overlayRef?.detach();
    this.cd.detectChanges();
  }
}
