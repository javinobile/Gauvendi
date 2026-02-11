import {
  ConnectedPosition,
  Overlay,
  OverlayPositionBuilder,
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import {
  KEYBOARD_EVENT_KEYS,
  KEYBOARD_EVENTS
} from '@app/constants/accessibility.const';
import { AccessibilityService } from '@app/services/accessibility.service';
import { SearchBarHandlerService } from '@app/services/search-bar-handler.service';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { SearchBarOverlayState } from '@models/search-bar-overlay-state';
import { skipWhile } from 'rxjs/operators';

@Directive({
  selector: '[appSearchBarOverlay]',
  standalone: true
})
export class SearchBarOverlayDirective
  extends DirSettingDirective
  implements OnDestroy
{
  private elementRef = inject(ElementRef);
  private overlay = inject(Overlay);
  private overlayPositionBuilder = inject(OverlayPositionBuilder);
  private searchBarHandlerService = inject(SearchBarHandlerService);
  private accessibilityService = inject(AccessibilityService);

  @Input() component: any;
  @Input() isDisplayed = true;
  @Input() positions: ConnectedPosition[];
  @Input() origin: HTMLElement;
  @Input() data: object;
  @Input() state: SearchBarOverlayState;
  @Output() valueChange = new EventEmitter();

  private overlayRef: OverlayRef;

  constructor() {
    super();
  }

  ngOnDestroy(): void {
    this.overlayRef?.detach();
  }

  initTooltip(): void {
    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo(this.origin || this.elementRef)
      .withPositions([...this.positions]);

    if (!this.overlayRef?.hasAttached()) {
      this.overlayRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.block(),
        panelClass: '!top-0',
        hasBackdrop: false
      });
      this.overlayRef.setDirection(this.direction());
      const tooltipRef: any = this.overlayRef.attach(
        new ComponentPortal(this.component)
      );
      tooltipRef.instance.overlayRef = this.overlayRef;
      tooltipRef.instance.data = this.data;
      tooltipRef.instance.value$
        .pipe(skipWhile((value) => value === null))
        .subscribe((value) => {
          this.valueChange.next(value);
          setTimeout(() => {
            this.overlayRef?.detach();
          }, 100);
        });

      const currentOverlay = [
        ...this.searchBarHandlerService.overlayRefList$?.value,
        this.overlayRef
      ];
      this.searchBarHandlerService.overlayRefList$.next(currentOverlay);
    } else {
      this.overlayRef?.detach();
    }
  }

  @HostListener('click')
  onClick() {
    const overlayRefList =
      this.searchBarHandlerService.overlayRefList$?.getValue();
    overlayRefList?.forEach((ref) => ref?.detach());
    this.searchBarHandlerService.openOverlayState$.next(this.state);
    this.initTooltip();
    this.handleKeyboard();
  }

  handleKeyboard() {
    const overlayEl = this.overlayRef?.overlayElement;
    if (overlayEl) {
      setTimeout(() => {
        this.accessibilityService.focusOnElement(overlayEl);
      }, 200);
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (
        event.key === KEYBOARD_EVENT_KEYS.ESCAPE &&
        this.overlayRef?.hasAttached()
      ) {
        this.searchBarHandlerService.openOverlayState$.next(null);
      }
    };
    document.addEventListener(KEYBOARD_EVENTS.KEYDOWN, handleEscape);

    const subscription =
      this.searchBarHandlerService.openOverlayState$.subscribe((state) => {
        if (state === null) {
          this.overlayRef?.detach();
          this.elementRef.nativeElement.focus();
          document.removeEventListener(KEYBOARD_EVENTS.KEYDOWN, handleEscape);
          subscription.unsubscribe();
        }
      });
  }
}
