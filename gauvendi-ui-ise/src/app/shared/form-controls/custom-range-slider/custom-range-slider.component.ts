import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  input,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSliderDragEvent, MatSliderModule } from '@angular/material/slider';
import { AbstractFormControlComponent } from '@app/shared/form-controls/abstract-form-control';

@Component({
  selector: 'app-custom-range-slider',
  templateUrl: './custom-range-slider.component.html',
  styleUrls: ['./custom-range-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatSliderModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => CustomRangeSliderComponent)
    }
  ]
})
export class CustomRangeSliderComponent extends AbstractFormControlComponent<{
  max: number;
  min: number;
}> {
  maxDrag = input<number>(500);
  minDrag = input<number>(0);
  currencyCode = input<string>();

  override value: { max: number; min: number };

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }
    return `${value}`;
  }

  constructor(changeDetectorRef: ChangeDetectorRef) {
    super(changeDetectorRef);
  }

  changeMin(min: number) {
    this.value = {
      ...this.value,
      min
    };
    this.onChange(this.value);
    this.onTouched();
    this.changeDetectorRef.detectChanges();
  }

  changeMax(max: number) {
    this.value = {
      ...this.value,
      max
    };
    this.onChange(this.value);
    this.onTouched();
    this.changeDetectorRef.detectChanges();
  }
}
