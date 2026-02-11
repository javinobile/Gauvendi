import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AbstractFormControlComponent} from "@app/shared/form-controls/abstract-form-control";
import {RadioButtonItem} from "@models/radio-button.model";
import {FormsModule, NG_VALUE_ACCESSOR} from "@angular/forms";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";

@Component({
  selector: 'app-custom-radio-button',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './custom-radio-button.component.html',
  styleUrls: ['./custom-radio-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => CustomRadioButtonComponent),
    },
  ],
})
export class CustomRadioButtonComponent extends AbstractFormControlComponent<string> {
  @Input() allItems: RadioButtonItem[];
  @Input() customClass = '';
  @Input() customLabel = '';

  constructor(changeDetectorRef: ChangeDetectorRef) {
    super(changeDetectorRef);
  }

  change(value: string) {
    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.changeDetectorRef.detectChanges();
  }
}
