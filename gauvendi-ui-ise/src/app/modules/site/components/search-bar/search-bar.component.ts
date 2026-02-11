import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SearchBarOverlayDirective } from '@app/modules/site/directives/search-bar-overlay.directive';
import { OptionUnitsInfoComponent } from '@app/shared/components/option-units-info/option-units-info.component';
import { RoomSummaryLabelComponent } from '@app/shared/components/room-summary-label/room-summary-label.component';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { InputComponent } from '@app/shared/form-controls/input/input.component';
import { DateWithLocalePipe } from '@app/shared/pipes/date-with-locale.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RecommendationFlow } from '@models/recommendation-flow';
import { SearchBarAbstractComponent } from '../search-bar-abstract/search-bar-abstract.component';
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    InputComponent,
    MatIconModule,
    ReactiveFormsModule,
    SearchBarOverlayDirective,
    TranslatePipe,
    FilterSvgDirective,
    DateWithLocalePipe,
    OptionUnitsInfoComponent,
    RoomSummaryLabelComponent
  ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent extends SearchBarAbstractComponent {
  @ViewChild('calendarOrigin', { static: false }) calendarOriginEle: ElementRef;

  override ngOnInit(): void {
    super.ngOnInit();

    this.searchBarHandlerService.flowSuggestion$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value === RecommendationFlow.CALENDAR) {
          setTimeout(() => {
            this.calendarOriginEle?.nativeElement?.click();
          }, 100);
        }
      });
  }
}
