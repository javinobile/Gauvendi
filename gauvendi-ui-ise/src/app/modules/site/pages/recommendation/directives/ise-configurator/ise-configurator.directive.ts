import {Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayPositionBuilder,
  OverlayRef
} from "@angular/cdk/overlay";
import {merge, Observable, Subscription} from "rxjs";
import {ComponentPortal} from "@angular/cdk/portal";
import {
  IseConfiguratorManagementComponent
} from "@app/modules/site/pages/recommendation/directives/ise-configurator/components/ise-configurator-management/ise-configurator-management.component";
import {SearchBarHandlerService} from "@app/services/search-bar-handler.service";
import {SearchBarOverlayState} from "@models/search-bar-overlay-state";

@Directive({
  selector: '[appIseConfigurator]'
})
export class IseConfiguratorDirective implements OnInit, OnDestroy {
  @Input() isDisplayed = true;
  @Output() closed = new EventEmitter();
  overlayRef: OverlayRef;
  subscriptions: Subscription[] = [];
  eleRef: any;

  get position(): ConnectedPosition[] {
    return [
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'top',
      }
    ];
  }

  get positionStrategy(): FlexibleConnectedPositionStrategy {
    return this.overlayPositionBuilder.flexibleConnectedTo(this.el).withPositions(this.position);
  }

  constructor(
    private el: ElementRef,
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private searchBarHandlerService: SearchBarHandlerService
  ) {
  }

  ngOnInit() {

  }

  buildOverlay(): boolean {
    if (this.isDisplayed) {
      if (this.overlayRef?.hasAttached()) {
        this.overlayRef.detach();
      }
      this.overlayRef = this.overlay.create({
        hasBackdrop: false,
        positionStrategy: this.positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.block()
      });

      return true;
    }
    return false;
  }

  buildTooltip(): boolean {
    if (this.buildOverlay()) {
      this.eleRef = this.overlayRef.attach(new ComponentPortal(IseConfiguratorManagementComponent));
      this.eleRef.instance.overlayRef = this.overlayRef;
      this.eleRef.instance.maxWidth = 950;
      this.eleRef.instance.isDisplayed = true;
      this.searchBarHandlerService.openOverlayState$.next(SearchBarOverlayState.Configurator);
      const currentOverlay = [...this.searchBarHandlerService.overlayRefList$?.value, this.overlayRef];
      this.searchBarHandlerService.overlayRefList$.next(currentOverlay);
      this.subscriptions.push(
        this.dropdownClosingActions()
          .subscribe(() => {
            this.eleRef.instance.isDisplayed = false;
            this.closed.emit(true);
          })
      );
      return true;
    }
    return false;
  }

  @HostListener('click', ['$event'])
  onClick(event: any): void {
    if (this.overlayRef?.hasAttached()) {
      this.overlayRef?.detach();
    } else {
      setTimeout(() => {
        event.stopPropagation();
        this.buildTooltip();
        this.closed.emit(false);
      }, 100);
    }
  }
  private dropdownClosingActions(): Observable<MouseEvent | void | string> {
    const backdropClick$ = this.overlayRef.backdropClick();
    return merge(this.overlayRef.detachments());
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
    this.overlayRef?.detach();
  }
}
