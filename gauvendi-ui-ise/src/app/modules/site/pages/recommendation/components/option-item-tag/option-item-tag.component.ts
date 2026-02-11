import { CommonModule } from '@angular/common';
import { Component, input, Input } from '@angular/core';
import { BookingFlow } from '@app/core/graphql/generated/graphql';
import { IRoomSummary } from '@app/models/common.model';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { OptionIconPipe } from '../../pipes/option-icon.pipe';
import { OptionTagPipe } from '../../pipes/option-tag.pipe';
import { TagColorPipe } from '../../pipes/tag-color.pipe';
@Component({
  selector: 'app-option-item-tag',
  templateUrl: './option-item-tag.component.html',
  standalone: true,
  imports: [
    CommonModule,
    OptionTagPipe,
    TagColorPipe,
    OptionIconPipe,
    TranslatePipe,
    FilterSvgDirective
  ]
})
export class OptionItemTagComponent {
  @Input() tag: BookingFlow;
  @Input() hideExtra: boolean = false;
  @Input() isBundle = false;
  BookingFlow = BookingFlow;
  data = input<IRoomSummary>();
}
