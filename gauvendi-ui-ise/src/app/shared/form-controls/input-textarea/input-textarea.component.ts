import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AbstractFormControlComponent } from '../abstract-form-control';

@Component({
  selector: 'app-input-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-textarea.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => InputTextareaComponent),
    },
  ],
})
export class InputTextareaComponent extends AbstractFormControlComponent<string> {
  @Input() customClass = '';
  @Input() rows = 5;

  constructor(changeDetectorRef: ChangeDetectorRef) {
    super(changeDetectorRef);
  }

  changeValue(val) {
    this.value = val;
    this.onChange(val);
    this.writeValue(val);
    this.onTouched();
    this.changeDetectorRef.detectChanges();
  }
}
