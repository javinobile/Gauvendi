import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'gvd-calendar-tab',
  standalone: true,
  templateUrl: './calendar-tab.component.html',
  styleUrl: './calendar-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, TranslatePipe]
})
export class CalendarTabComponent {
  @Input() index: number;
  @Input() selectedIndex: number;

  @Output() changeTab = new EventEmitter();
  @Output() closeTab = new EventEmitter();

  closeCurrentTab(event: Event, index): void {
    event.stopPropagation();
    this.closeTab.emit(index);
  }
}
