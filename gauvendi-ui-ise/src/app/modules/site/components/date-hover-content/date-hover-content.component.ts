import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {OverlayRef} from "@angular/cdk/overlay";
import {animate, style, transition, trigger} from "@angular/animations";
import {MatIconModule} from "@angular/material/icon";

@Component({
  selector: 'app-date-hover-content',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './date-hover-content.component.html',
  styleUrls: ['./date-hover-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({opacity: 0}),
        animate('500ms', style({opacity: 1})),
      ]),
      transition(':leave', [
        animate('500ms', style({opacity: 0})),
      ]),
    ]),
  ],
})
export class DateHoverContentComponent {
  maxWidth: string;
  numberOfNightsMsg: string;
  restrictionMsg: string;
  showWarning = false;
  overlayRef: OverlayRef;
}
