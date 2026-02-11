import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SearchBarContentMobileComponent } from '@app/modules/site/components/search-bar-content-mobile/search-bar-content-mobile.component';
import { OverlayMobileDirective } from '@app/modules/site/directives/overlay-mobile.directive';
import { OptionUnitsInfoComponent } from '@app/shared/components/option-units-info/option-units-info.component';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { DateWithLocalePipe } from '@app/shared/pipes/date-with-locale.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { SearchBarAbstractComponent } from '../search-bar-abstract/search-bar-abstract.component';
@Component({
  selector: 'app-search-bar-mobile',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    FilterSvgDirective,
    OverlayMobileDirective,
    DateWithLocalePipe,
    OptionUnitsInfoComponent
  ],
  templateUrl: './search-bar-mobile.component.html',
  styleUrls: ['./search-bar-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarMobileComponent extends SearchBarAbstractComponent {
  popUpComponent = SearchBarContentMobileComponent;

  override ngOnInit(): void {
    super.ngOnInit();
  }
}
