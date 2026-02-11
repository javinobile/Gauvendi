import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-options-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './options-skeleton.component.html',
  styleUrls: ['./options-skeleton.component.scss']
})
export class OptionsSkeletonComponent {
  items = new Array(6);
}
