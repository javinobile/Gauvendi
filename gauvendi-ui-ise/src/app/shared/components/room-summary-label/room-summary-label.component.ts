import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import { IRoomSummary } from '@app/models/common.model';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-room-summary-label',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './room-summary-label.component.html',
  styleUrls: ['./room-summary-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomSummaryLabelComponent {
  roomSummary = input.required<IRoomSummary>();
  isCapitalizeFirst = input<boolean>(false);
  isCapitalizeAllValue = input<boolean>(false);
  labelClass = input<string>('');
  showForLabel = input<boolean>(true);
  showTotalRoom = input<boolean>(false);

  dataConfig = computed(() => this.setDataConfig());

  constructor() {}

  setDataConfig() {
    const item = this.roomSummary();
    if (!item) return [];

    return [
      ...(this.showTotalRoom()
        ? [
            {
              label: 'UNIT',
              pluralLabel: 'UNITS',
              value: item.totalRoom,
              isPluralLabel: item.totalRoom > 1
            }
          ]
        : []),
      {
        label: 'ADULT',
        pluralLabel: 'ADULTS',
        value: item.adults,
        isPluralLabel: item.adults > 1
      },
      {
        label: 'CHILD',
        pluralLabel: 'CHILDREN',
        value: item.children,
        isPluralLabel: item.children > 1
      },
      {
        label: 'PET',
        pluralLabel: 'PETS',
        value: item.pets,
        isPluralLabel: item.pets > 1
      }
    ];
  }
}
