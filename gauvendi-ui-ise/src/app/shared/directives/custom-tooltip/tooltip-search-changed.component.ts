import { animate, style, transition, trigger } from '@angular/animations';
import { OverlayRef } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonService } from '@app/services/common.service';

@Component({
  template: `
    @if (
      {
        isFeatureChanged: isFeatureChanged$ | async,
        isSearchBarChanged: isSearchBarChanged$ | async
      };
      as vm
    ) {
      <div
        *ngIf="vm.isSearchBarChanged"
        #listPopup
        [@tooltip]
        [style.--max-width]="maxWidth"
        class="tooltip-content rounded-[8px]"
      >
        <div class="content allow-cr flex items-center gap-3">
          <mat-icon class="min-w-[20px] min-h-[20px]">info_outlined</mat-icon>
          <div class="flex-1">
            <div
              class="whitespace-pre-line"
              [innerHTML]="
                ('BOOKING_PREFERENCES_CHANGED' | translate | async).replace(
                  '{0}',
                  (vm.isFeatureChanged ? 'FIND_MATCH' : 'SEARCH')
                    | translate
                    | async
                )
              "
            ></div>
          </div>
        </div>
      </div>
    }
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
export class TooltipSearchChangedComponent {
  private readonly cd = inject(ChangeDetectorRef);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);

  isFeatureChanged$ = this.commonService.isFeatureChanged
    .asObservable()
    .pipe(takeUntilDestroyed(this.destroyRef));
  isSearchBarChanged$ = this.commonService.isSearchBarChanged
    .asObservable()
    .pipe(takeUntilDestroyed(this.destroyRef));

  content: string;
  maxWidth: string;

  overlayRef: OverlayRef;

  @HostListener('mouseleave')
  onMouseEnter() {
    this.overlayRef?.detach();
    this.cd.detectChanges();
  }
}
