import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-extra-service-list-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './extra-service-list-loading.component.html',
  styleUrls: ['./extra-service-list-loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExtraServiceListLoadingComponent {}
