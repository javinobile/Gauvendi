import {Directive, ElementRef, HostListener, Input, OnDestroy} from '@angular/core';
import {ComponentPortal} from "@angular/cdk/portal";
import {ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef} from "@angular/cdk/overlay";
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';

@Directive({
  selector: '[appSelectLangAndCurrency]',
  standalone: true,
})
export class SelectLangAndCurrencyDirective extends DirSettingDirective implements OnDestroy {
  @Input() component: any;
  @Input() isDisplayed = true;
  @Input() positions: ConnectedPosition[];
  @Input() origin: HTMLElement;
  @Input() data: object;

  private overlayRef: OverlayRef;

  constructor(
    private elementRef: ElementRef,
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder
  ) {
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
        panelClass: 'custom-dialog'
      });
      this.overlayRef.setDirection(this.direction());
      const tooltipRef: any = this.overlayRef.attach(new ComponentPortal(this.component));
      tooltipRef.instance.overlayRef = this.overlayRef;
      tooltipRef.instance.data = this.data;
    } else {
      this.overlayRef?.detach();
    }

  }

  @HostListener('click')
  onClick() {
    this.initTooltip();
  }

}
