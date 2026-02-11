import {
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayPositionBuilder,
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { DateHoverContentComponent } from '@app/modules/site/components/date-hover-content/date-hover-content.component';

@Directive({
  selector: '[appDateTooltip]',
  standalone: true
})
export class DateTooltipDirective implements OnChanges, OnDestroy {
  @Input() customStrategy: FlexibleConnectedPositionStrategy;
  @Input() isDisabled = false;
  @Input() maxWidth = '350px';
  @Input() numberOfNightsMsg: string;
  @Input() restrictionMsg: string;
  @Input() showWarning = false;

  private overlayRef: OverlayRef;
  private isTouchDevice = false;

  constructor(
    private elementRef: ElementRef,
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder
  ) {
    // Detect if it's a touch device
    this.isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  initTooltip(): void {
    const positionStrategy =
      this.customStrategy ||
      this.overlayPositionBuilder
        .flexibleConnectedTo(this.elementRef)
        .withPositions([
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'center',
            overlayY: 'bottom',
            offsetY: -5
          }
        ]);

    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create({ positionStrategy });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('isDisabled') && this.isDisabled) {
      this.overlayRef?.detach();
    }
  }

  ngOnDestroy(): void {
    this.overlayRef?.detach();
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    // Only show tooltip on hover for non-touch devices
    if (this.isTouchDevice) return;

    this.renderOverlay();
  }

  @HostListener('mouseover')
  onMouseOver() {
    // Only show tooltip on hover for non-touch devices
    if (this.isTouchDevice) return;

    this.renderOverlay();
  }

  @HostListener('click')
  onClick() {
    // Don't show tooltip on click for touch devices to avoid interference
    const isValioted =
      this.elementRef.nativeElement?.classList?.contains('violated');
    if (!(!this.isTouchDevice || isValioted)) return;

    this.renderOverlay();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.overlayRef?.detach();
  }

  @HostListener('focusout')
  onFocusOut() {
    this.overlayRef?.detach();
  }

  @HostListener('touchstart')
  onTouchStart() {
    this.renderOverlay();
  }

  @HostListener('touchend')
  onTouchEnd() {
    this.overlayRef?.detach();
  }

  renderOverlay(): void {
    if (
      !this.isDisabled &&
      (this.numberOfNightsMsg?.length > 0 || this.restrictionMsg?.length > 0)
    ) {
      if (!this.overlayRef?.hasAttached()) {
        this.initTooltip();
        const tooltipRef: ComponentRef<DateHoverContentComponent> =
          this.overlayRef?.attach(
            new ComponentPortal(DateHoverContentComponent)
          );
        tooltipRef.instance.maxWidth = this.maxWidth;
        tooltipRef.instance.overlayRef = this.overlayRef;
        tooltipRef.instance.numberOfNightsMsg = this.numberOfNightsMsg;
        tooltipRef.instance.restrictionMsg = this.restrictionMsg;
        tooltipRef.instance.showWarning = this.showWarning;
      }
    }
  }
}
