import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayPositionBuilder,
  OverlayRef,
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
  SimpleChanges,
} from '@angular/core';
import { CustomTooltipComponent } from './custom-tooltip.component';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { TooltipSearchChangedComponent } from './tooltip-search-changed.component';

@Directive({
  selector: '[appCustomTooltip]',
})
export class CustomTooltipDirective extends DirSettingDirective implements OnDestroy, OnChanges {
  @Input() customStrategy: FlexibleConnectedPositionStrategy;
  @Input() isDisabled = false;
  @Input() maxWidth = '350px';
  @Input() tooltipMessage: string;
  @Input() component: 'DEFAULT' | 'SEARCH_CHANGES' = 'DEFAULT';

  private overlayRef: OverlayRef;

  constructor(private elementRef: ElementRef, private overlay: Overlay, private overlayPositionBuilder: OverlayPositionBuilder) {
    super();
  }

  initTooltip(): void {
    const connectedPosition: ConnectedPosition[] = this.direction() === 'ltr'
      ? [
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 15,
          panelClass: 'bottom-left',
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          panelClass: 'top-left',
        },
      ]
      : [
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 15,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
        },
      ];
    const positionStrategy =
      this.customStrategy ||
      this.overlayPositionBuilder.flexibleConnectedTo(this.elementRef).withPositions(connectedPosition);

    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create({
        positionStrategy,
        panelClass: 'tooltip-overlay',
        scrollStrategy: this.overlay.scrollStrategies.close({
          threshold: 0.2,
        }),
      });
      this.overlayRef.setDirection(this.direction());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isDisabled'] && this.isDisabled) {
      this.overlayRef?.detach();
    }
  }

  ngOnDestroy(): void {
    this.overlayRef?.detach();
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.renderOverlay();
  }

  @HostListener('mouseover')
  onMouseOver() {
    this.renderOverlay();
  }

  @HostListener('click')
  onClick() {
    this.renderOverlay();
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event: any) {
    if (event?.relatedTarget?.className?.indexOf('tooltip-content') === -1) {
      this.overlayRef?.detach();
    }
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: any) {
    if (event?.relatedTarget?.className?.indexOf('tooltip-content') === -1) {
      this.overlayRef?.detach();
    }
  }

  @HostListener('touchstart')
  onTouchStart() {
    this.renderOverlay();
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: any) {
    if (event?.relatedTarget?.className?.indexOf('tooltip-content') === -1) {
      this.overlayRef?.detach();
    }
  }

  renderOverlay(): void {
    if (!this.isDisabled && this.tooltipMessage?.length > 0) {
      if (!this.overlayRef?.hasAttached()) {
        this.initTooltip();
        let tooltipRef: ComponentRef<any>;
        switch (this.component) {
          case 'SEARCH_CHANGES':
            tooltipRef = this.overlayRef?.attach(new ComponentPortal(TooltipSearchChangedComponent));
            break;
          default:
            tooltipRef = this.overlayRef?.attach(new ComponentPortal(CustomTooltipComponent));
            break;
        }
        tooltipRef.instance.content = this.tooltipMessage;
        tooltipRef.instance.maxWidth = this.maxWidth;
        tooltipRef.instance.overlayRef = this.overlayRef;
      }
    }
  }
}
