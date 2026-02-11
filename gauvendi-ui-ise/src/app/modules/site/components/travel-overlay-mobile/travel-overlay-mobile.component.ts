import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DropdownChildrenAgeComponent } from '@app/shared/form-controls/dropdown-children-age/dropdown-children-age.component';
import { NumericStepComponent } from '@app/shared/form-controls/numeric-step/numeric-step.component';
import { CalculateAgePipe } from '@app/shared/pipes/calculate-age.pipe';
import { ParseFormGroupPipe } from '@app/shared/pipes/parse-form-group.pipe';
import { ReplaceStrPipe } from '@app/shared/pipes/replace-str.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TravelOverlayAbstractComponent } from '../travel-overlay-abstract/travel-overlay-abstract.component';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';

@Component({
  selector: 'app-travel-overlay-mobile',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MatIconModule,
    CalculateAgePipe,
    DropdownChildrenAgeComponent,
    NumericStepComponent,
    ParseFormGroupPipe,
    ReactiveFormsModule,
    ReplaceStrPipe,
    FilterSvgDirective
  ],
  templateUrl: './travel-overlay-mobile.component.html',
  styleUrls: ['./travel-overlay-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelOverlayMobileComponent extends TravelOverlayAbstractComponent {
  themeColors$ = this.hotelConfigService.themeColors$;
}
