import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  Input
} from '@angular/core';

@Directive({
  selector: '[gvdHideElement]',
  standalone: true
})
export class HideElementDirective implements AfterViewInit {
  private elementRef = inject(ElementRef);

  @Input() conditionElement: HTMLElement;
  constructor() {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.hideElement();
    });
  }

  hideElement(): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    if (!this.conditionElement || !el) return;

    if (
      this.conditionElement.scrollHeight === this.conditionElement.clientHeight
    ) {
      el.classList.add('!hidden');
    }
  }
}
