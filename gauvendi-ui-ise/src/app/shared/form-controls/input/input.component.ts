import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  TemplateRef
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { AbstractFormControlComponent } from '../abstract-form-control';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatAutocompleteModule],
  templateUrl: './input.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => InputComponent)
    }
  ]
})
export class InputComponent extends AbstractFormControlComponent<
  string | number
> {
  @Input() allowSpecialCharacter = true;
  @Input() customClass = '';
  @Input() customInputClass = '';
  @Input() idx: string;
  @Input() prefix: TemplateRef<unknown>;
  @Input() showPassword = false;
  @Input() suffix: TemplateRef<unknown>;
  @Input() type: 'text' | 'number' | 'password' | 'email' = 'text';

  @Output() blur = new EventEmitter();

  options = ['abc', 'def'];

  isShowPassword = false;

  constructor(changeDetectorRef: ChangeDetectorRef) {
    super(changeDetectorRef);
  }

  changeValue(evt: string | number) {
    this.value = evt;
    this.onChange(evt);
    this.onTouched();
    this.changeDetectorRef.detectChanges();
  }

  onKeyPress(evt: any): void {
    if (!this.allowSpecialCharacter) {
      const keycode = evt?.which || evt?.keyCode;

      if (
        keycode < 48 ||
        (keycode > 57 && keycode < 65) ||
        (keycode > 90 && keycode < 97) ||
        keycode > 122
      ) {
        evt?.preventDefault();
        return;
      }
    }
  }

  onBlur(): void {
    this.onTouched();
    this.blur.emit();
  }

  protected readonly ChangeDetectorRef = ChangeDetectorRef;
}
