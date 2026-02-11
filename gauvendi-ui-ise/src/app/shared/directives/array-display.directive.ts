import { AfterViewChecked, AfterViewInit, Directive, ElementRef, Input } from "@angular/core";

@Directive({
  selector: "[appArrayDisplay]",
  standalone: true,
})
export class ArrayDisplayDirective implements AfterViewInit {
  @Input() maxLineAllow = 2;
  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    const parentElement = this.elementRef.nativeElement;
    const childElements = parentElement.children;
    const baseHeight = childElements[0]?.offsetHeight;

    let count = 0;
    for (let i = 0; i < childElements.length; i++) {
      if (this.elementRef.nativeElement?.offsetHeight > baseHeight * this.maxLineAllow + (this.maxLineAllow - 1) * 4) {
        // childElements[i].remove();
        count ++;
      }
    }
  }
}
