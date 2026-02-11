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
import { MatMenuModule } from '@angular/material/menu';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { SectionCodeEnum } from '@store/multi-lang/multi-lang.state';

@Component({
  selector: 'app-dropdown-children-age',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    TranslatePipe,
    MatSelectModule
  ],
  templateUrl: './dropdown-children-age.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => DropdownChildrenAgeComponent)
    }
  ]
})
export class DropdownChildrenAgeComponent implements ControlValueAccessor {
  value: number;

  @Input() min: number = 0;
  @Input() max: number;
  @Input() customClass: string = '';
  @Output() valueChange = new EventEmitter<number>();

  module = SectionCodeEnum.ISE;

  get ageOptions(): number[] {
    return Array.from(
      { length: this.max + 1 - this.min },
      (_, i) => i + this.min
    );
  }

  onChange = (value: number) => {};
  onTouched = () => {};

  writeValue(obj: number): void {
    if (obj > this.max) {
      this.value = this.max;
    } else if (obj < this.min) {
      this.value = this.min;
    } else {
      this.value = obj;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  updateValue(value: number): void {
    this.value = value;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
  }

  openDropdown(selectElem: MatSelect): void {
    if (!selectElem) return;

    selectElem.open();
  }
}
