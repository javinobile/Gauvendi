import {Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output} from '@angular/core';
import {Overlay, OverlayPositionBuilder, OverlayRef} from "@angular/cdk/overlay";
import {ComponentPortal} from "@angular/cdk/portal";
import {skipWhile} from "rxjs/operators";
import {Subscription} from "rxjs";
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';

@Directive({
  selector: '[appOverlayMobile]',
  standalone: true
})
export class OverlayMobileDirective extends DirSettingDirective implements OnDestroy {
  @Input() component: any;
  @Input() isDisplayed = true;
  @Input() data: object;
  @Output() valueChange = new EventEmitter();
  private overlayRef: OverlayRef;
  subscriptions: Subscription[] = [];

  constructor(
    private elementRef: ElementRef,
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder
  ) {
    super();
  }

  ngOnDestroy(): void {
    this.overlayRef?.detach();
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }

  initTooltip(): void {
    const positionStrategy = this.overlayPositionBuilder
      .global().centerHorizontally().bottom('0');

    if (!this.overlayRef?.hasAttached()) {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.block(),
        panelClass: 'custom-dialog',
        width: '100%'
      });
      this.overlayRef.setDirection(this.direction());
      const tooltipRef: any = this.overlayRef.attach(new ComponentPortal(this.component));
      tooltipRef.instance.overlayRef = this.overlayRef;
      tooltipRef.instance.isOpen = true;
      tooltipRef.instance.data = this.data;

      this.subscriptions.push(
        tooltipRef.instance.value$.pipe(
          skipWhile(value => value === null)
        ).subscribe((value) => {
          this.valueChange.next(value);
          setTimeout(() => {
            tooltipRef.instance.isOpen = false;
            setTimeout(() => {
              this.overlayRef?.detach();
            }, 100);
          });
        })
      );
    } else {
      this.overlayRef?.detach();
    }

  }

  @HostListener('click')
  onClick() {
    setTimeout(() => {
      this.initTooltip();
    }, 100)
  }

}
