import {ComponentRef, Directive, ElementRef, HostListener, Input, SimpleChanges} from '@angular/core';
import {FlexibleConnectedPositionStrategy, Overlay, OverlayPositionBuilder, OverlayRef} from "@angular/cdk/overlay";
import {ComponentPortal} from "@angular/cdk/portal";
import {
  FeatureTooltipContentComponent
} from "@app/shared/directives/feature-tooltip/feature-tooltip-content/feature-tooltip-content.component";
import {HotelRetailFeature} from "@core/graphql/generated/graphql";
import { IFeature } from '@app/models/option-item.model';

@Directive({
  selector: '[appFeatureTooltip]',
  standalone: true
})
export class FeatureTooltipDirective {

  @Input() customStrategy: FlexibleConnectedPositionStrategy;
  @Input() isDisabled = false;
  @Input() maxWidth = '350px';
  @Input() data: IFeature[];
  @Input() isOtherFeature = false;
  @Input() isAlternativeOption = false;

  private overlayRef: OverlayRef;

  constructor(private elementRef: ElementRef, private overlay: Overlay, private overlayPositionBuilder: OverlayPositionBuilder) {
  }

  initTooltip(): void {
    const positionStrategy =
      this.customStrategy ||
      this.overlayPositionBuilder.flexibleConnectedTo(this.elementRef).withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          panelClass: 'bottom-left'
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          panelClass: 'top-left'
        },
      ]);

    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create({
        positionStrategy,
        panelClass: 'tooltip-overlay',
        scrollStrategy: this.overlay.scrollStrategies.close({
          threshold: 0.2
        })
      });
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
    if (!this.isDisabled && this.data?.length > 0) {
      if (!this.overlayRef?.hasAttached()) {
        this.initTooltip();
        const tooltipRef: ComponentRef<FeatureTooltipContentComponent> = this.overlayRef?.attach(new ComponentPortal(FeatureTooltipContentComponent));
        tooltipRef.instance.content = this.data;
        tooltipRef.instance.maxWidth = this.maxWidth;
        tooltipRef.instance.overlayRef = this.overlayRef;
        tooltipRef.instance.isOtherFeature = this.isOtherFeature;
        tooltipRef.instance.isAlternativeOption = this.isAlternativeOption;
      }
    }
  }

}
