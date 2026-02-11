import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EDisplayMode } from '@app/models/display-mode.model';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';

@Component({
  selector: 'app-choose-view-mode',
  templateUrl: './choose-view-mode.component.html',
  standalone: true,
  imports: [CommonModule, FilterSvgDirective]
})
export class ChooseViewModeComponent {
  @Input({ required: true }) active: number;
  @Input() hotelPrimaryColor: string;
  @Input() colorText: string;
  @Output() activeChange = new EventEmitter<EDisplayMode>();

  displayModes = [
    {
      mode: EDisplayMode.Grid,
      icon: 'assets/icons/grid.svg'
    },
    {
      mode: EDisplayMode.Tiles,
      icon: 'assets/icons/tile.svg'
    },
    {
      mode: EDisplayMode.List,
      icon: 'assets/icons/list.svg'
    }
  ];

  displayTabletModes = [
    {
      mode: EDisplayMode.Grid,
      icon: 'assets/icons/grid.svg'
    },
    {
      mode: EDisplayMode.Tiles,
      icon: 'assets/icons/tile.svg'
    }
  ];
}
