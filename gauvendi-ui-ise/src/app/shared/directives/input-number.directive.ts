import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
  selector: '[appInputNumber]',
  standalone: true
})
export class InputNumberDirective {

  private regex: RegExp = new RegExp(/^([0-9]+)\.?[0-9]*$/g);
  private specialKeys: Array<string> = [
    'Backspace',
    'Insert',
    'Delete',
    'Home',
    'End',
    'Tab',
    'Enter',
    'ArrowLeft',
    'ArrowRight'
  ];

  @Input() max: number;
  @Input() min: number;
  @Input() enableCopy = false;

  constructor(private el: ElementRef) {
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {

    // if(this.enableCopy) {
    //   this.specialKeys = [...this.specialKeys, 'c', 'v', 'a'];
    // }

    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }

    const current: string = this.el.nativeElement.value;
    const next: string = current.concat(event.key);
    if (next) {
      if (!String(next).match(this.regex)) {
        event.preventDefault();
      } else {
        if (this.min !== null && this.max !== null && !isNaN(this.min) && !isNaN(this.max)) {
          if (parseInt(next, 10) < this.min || parseInt(next, 10) > this.max) {
            event.preventDefault();
          }
        } else {
          if (this.min !== null && !isNaN(this.min)) {
            if (parseInt(next, 10) < this.min) {
              event.preventDefault();
            }
          }

          if (this.max !== null && !isNaN(this.max)) {
            if (parseInt(next, 10) > this.max) {
              event.preventDefault();
            }
          }
        }
      }
    }
  }

}
