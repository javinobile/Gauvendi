import { animate, style, transition, trigger } from '@angular/animations';
import { OverlayRef } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject
} from '@angular/core';

@Component({
  selector: 'app-custom-tooltip',
  template: `
    <div
      #listPopup
      [@tooltip]
      [style.--max-width]="maxWidth"
      class="tooltip-content rounded-[8px] break-words"
    >
      <span class="content allow-cr" [innerHTML]="content"></span>
    </div>
  `,
  styleUrls: ['./custom-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [animate('500ms', style({ opacity: 0 }))])
    ])
  ]
})
export class CustomTooltipComponent {
  private readonly cd = inject(ChangeDetectorRef);

  content: string;
  maxWidth: string;

  overlayRef: OverlayRef;

  @HostListener('mouseleave')
  onMouseEnter() {
    this.overlayRef?.detach();
    this.cd.detectChanges();
  }
}
