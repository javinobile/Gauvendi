import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room-detail-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-detail-loading.component.html',
  styleUrls: ['./room-detail-loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomDetailLoadingComponent {}
