import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-numeric-step',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './numeric-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => NumericStepComponent)
    }
  ]
})
export class NumericStepComponent implements ControlValueAccessor {
  @Input() min = 1;
  @Input() max: number;
  @Input() customClass: string = '';
  @Input() customTextClass: string = '';

  @Output() valueChange = new EventEmitter<number>();
  @Output() typeChange = new EventEmitter<string>();

  value: number;

  onChange = (value: number) => {};
  onTouched = () => {};

  constructor() {}

  writeValue(obj: number): void {
    if (obj > this.max) {
      this.value = this.max;
    } else if (obj < this.min) {
      this.value = this.min;
    } else {
      this.value = obj || 0;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {}

  updateValue(type: 'add' | 'subtract') {
    type === 'add' ? this.value++ : this.value--;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
    this.typeChange.emit(type);
  }
}
