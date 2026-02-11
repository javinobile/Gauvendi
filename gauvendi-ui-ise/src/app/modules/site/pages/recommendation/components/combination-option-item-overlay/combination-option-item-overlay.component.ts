import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CombinationOptionItemMobileComponent } from '@app/modules/site/pages/recommendation/components/combination-option-item-mobile/combination-option-item-mobile.component';
import { ICombinationOptionItem } from '@models/option-item.model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-combination-option-item-overlay',
  standalone: true,
  imports: [CommonModule, CombinationOptionItemMobileComponent],
  templateUrl: './combination-option-item-overlay.component.html',
  styleUrls: ['./combination-option-item-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CombinationOptionItemOverlayComponent {
  @Input() data: ICombinationOptionItem;
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
