import {ComponentRef, Directive, ElementRef, HostListener, Input, SimpleChanges} from '@angular/core';
import {FlexibleConnectedPositionStrategy, Overlay, OverlayPositionBuilder, OverlayRef} from "@angular/cdk/overlay";
import {ComponentPortal} from "@angular/cdk/portal";
import {FeatureDescriptionContentComponent} from "./feature-description-content.component";

@Directive({
  selector: '[appFeatureDescriptionTooltip]',
  standalone: true
})
export class FeatureDescriptionTooltipDirective {

  @Input() customStrategy: FlexibleConnectedPositionStrategy;
  @Input() isDisabled = false;
  @Input() maxWidth = '350px';
  @Input() featureName: string;
  @Input() featureCode: string;
  @Input() featureDescription: string;
  @Input() featureIcon: string;
  @Input() isStandard = false;
  @Input() isDisplayIcon = true;

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
    if (!this.isDisabled) {
      if (!this.overlayRef?.hasAttached()) {
        this.initTooltip();
        const tooltipRef: ComponentRef<FeatureDescriptionContentComponent> = this.overlayRef?.attach(new ComponentPortal(FeatureDescriptionContentComponent));
        tooltipRef.instance.featureName = this.featureName;
        tooltipRef.instance.featureCode = this.featureCode;
        tooltipRef.instance.featureDescription = this.featureDescription;
        tooltipRef.instance.featureIcon = this.featureIcon;
        tooltipRef.instance.isStandard = this.isStandard;
        tooltipRef.instance.maxWidth = this.maxWidth;
        tooltipRef.instance.overlayRef = this.overlayRef;
        tooltipRef.instance.isDisplayIcon = this.isDisplayIcon;
      }
    }
  }
}
