import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {AbstractFormControlComponent} from '../abstract-form-control';
import {FilterSvgDirective} from "@app/shared/directives/filter-svg.directive";

@Component({
  selector: 'app-checkbox-c',
  standalone: true,
  imports: [CommonModule, FilterSvgDirective],
  templateUrl: './checkbox-c.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => CheckboxCComponent),
    },
  ],
  styleUrls: ['./checkbox-c.component.scss']
})
export class CheckboxCComponent extends AbstractFormControlComponent<boolean> {
  @Input() customClass = '';
  @Input() indeterminate = false;

  constructor(
    changeDetectorRef: ChangeDetectorRef
  ) {
    super(changeDetectorRef);
  }

  changeState(): void {
    this.value = !this.value;
    this.onChange(this.value);
    this.onTouched();
  }
}
