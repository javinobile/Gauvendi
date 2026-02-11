import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-matching-percent-tag',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './matching-percent-tag.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchingPercentTagComponent {
  @Input({ required: true }) matchPercent: number;
  @Input() useOldVersion = false;

  constructor() {}
}
