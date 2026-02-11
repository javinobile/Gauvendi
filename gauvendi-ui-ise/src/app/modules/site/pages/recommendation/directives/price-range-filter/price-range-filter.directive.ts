import {Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output} from '@angular/core';
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
  PriceRangeFilterComponent
} from "@app/modules/site/pages/recommendation/directives/price-range-filter/components/price-range-filter/price-range-filter.component";
import {EPriceView, ICombinationOptionItem} from "@models/option-item.model";
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';

@Directive({
  selector: '[appPriceRangeFilter]'
})
export class PriceRangeFilterDirective extends DirSettingDirective implements OnDestroy {
  @Input() isDisplayed = true;
  @Input() stayOptionSuggestionList: ICombinationOptionItem[];
  @Input() currencyRate: number;
  @Input() currencyCode: string;
  @Output() closed = new EventEmitter();
  overlayRef: OverlayRef;
  subscriptions: Subscription[] = [];
  eleRef: any;

  get position(): ConnectedPosition[] {
    return [
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
        panelClass: 'bottom-center',
        offsetY: 15
      }
    ];
  }

  get positionStrategy(): FlexibleConnectedPositionStrategy {
    return this.overlayPositionBuilder.flexibleConnectedTo(this.el).withPositions(this.position);
  }

  constructor(
    private el: ElementRef,
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder
  ) {
    super();
  }

  buildOverlay(): boolean {
    if (this.isDisplayed) {
      if (this.overlayRef?.hasAttached()) {
        this.overlayRef.detach();
      }
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-transparent-backdrop',
        panelClass: 'custom-dialog',
        positionStrategy: this.positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.block()
      });
      this.overlayRef.setDirection(this.direction())
      return true;
    }
    return false;
  }

  buildTooltip(): boolean {
    if (this.buildOverlay()) {
      this.eleRef = this.overlayRef.attach(new ComponentPortal(PriceRangeFilterComponent));
      this.eleRef.instance.overlayRef = this.overlayRef;
      this.eleRef.instance.stayOptionSuggestionList = this.stayOptionSuggestionList;
      this.eleRef.instance.currencyCode = this.currencyCode;
      this.eleRef.instance.currencyRate = this.currencyRate;
      this.subscriptions.push(
        this.dropdownClosingActions()
          .subscribe(() => {
            this.overlayRef?.detach();
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
    return merge(this.overlayRef.detachments(), backdropClick$);
  }


  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
    this.overlayRef?.detach();
  }

}
