import {ChangeDetectorRef, Directive, EventEmitter, Input, Output} from '@angular/core';
import {AbstractControl, ControlValueAccessor, FormControl, ValidationErrors,} from '@angular/forms';

@Directive()
export abstract class   AbstractFormControlComponent<T>
  implements ControlValueAccessor {
  value: T;
  @Input() label = '';
  @Input() isDisabled: boolean;
  @Input() isReadonly: boolean;
  @Input() isRequired: boolean;
  @Input() minLength: number;
  @Input() maxLength: number = 9999999;
  @Input() placeHolder = '';

  @Input() control: FormControl | AbstractControl;
  @Input() errors: ValidationErrors;
  @Output() enter = new EventEmitter();
  onChange = (value: T) => {
  };
  onTouched = () => {
  };

  constructor(public changeDetectorRef: ChangeDetectorRef) {
  }

  writeValue(obj: T): void {
    this.value = obj;
    this.onChange(obj);
    this.changeDetectorRef.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
