import {Directive, EventEmitter, HostListener, Output} from '@angular/core';

@Directive({
  selector: '[appCombinationHover]',
  standalone: true
})
export class CombinationHoverDirective {
  @Output() mouseHover = new EventEmitter();
  @HostListener('mouseenter') onMouseEnter() {
    this.mouseHover.emit(true);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.mouseHover.emit(false);
  }
}
