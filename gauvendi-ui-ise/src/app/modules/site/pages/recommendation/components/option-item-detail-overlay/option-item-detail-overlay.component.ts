import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IOptionItem } from '@models/option-item.model';
import { BehaviorSubject } from 'rxjs';
import { OverlayRef } from '@angular/cdk/overlay';
import { OptionItemDetailComponent } from '@app/modules/site/pages/recommendation/components/option-item-detail/option-item-detail.component';

@Component({
  selector: 'app-option-item-detail-overlay',
  standalone: true,
  imports: [CommonModule, OptionItemDetailComponent],
  templateUrl: './option-item-detail-overlay.component.html',
  styleUrls: ['./option-item-detail-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionItemDetailOverlayComponent {
  @Input() data: IOptionItem;
  value$ = new BehaviorSubject(null);
  overlayRef: OverlayRef;
  isOpen: boolean;
  isIOS = /iPhone|iPod|iPad/.test(navigator.userAgent);

  closeConfigurator(): void {
    this.isOpen = false;
    setTimeout(() => {
      this.overlayRef?.detach();
    }, 500);
  }

  selectRatePlan($event: any) {
    this.value$.next($event);
    this.closeConfigurator();
  }
}
