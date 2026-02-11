import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {CommonModule} from "@angular/common";
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors
} from "@angular/forms";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {FilterDropdownPipe} from "@app/shared/pipes/filter-dropdown.pipe";
import {InputNumberDirective} from "@app/shared/directives/input-number.directive";
import {DropdownItem} from "@models/dropdown-item.model";

@Component({
  selector: 'app-input-custom-phone-number',
  templateUrl: './input-custom-phone-number.component.html',
  styleUrls: ['./input-custom-phone-number.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [CommonModule, FilterDropdownPipe, MatOptionModule, MatSelectModule, ReactiveFormsModule, FormsModule, InputNumberDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => InputCustomPhoneNumberComponent),
    },
  ],
})
export class InputCustomPhoneNumberComponent implements ControlValueAccessor, OnChanges {
  @Input() allItems: DropdownItem[];
  @Input() control: FormControl | AbstractControl;
  @Input() errors: ValidationErrors;
  @Input() isDisabled: boolean;
  @Input() isRequired: boolean;
  @Input() label: string;
  @Input() noSearchMessage: string;
  @Input() note: string;
  @Input() panelClass: string;
  @Input() placeHolder: string;
  @Input() customClass: string;
  @Input() hasSearch = true;
  @Input() metadata = false;

  value: {
    phoneCode: string,
    phoneNumber: string,
    //labelCode: string
  };

  filter: string;

  constructor(
    private ref: ChangeDetectorRef
  ) {
  }

  onChange = (value: { phoneCode: string, phoneNumber: string }) => {
  };
  onTouched = () => {
  };

  writeValue(value: { phoneCode: string, phoneNumber: string, labelCode: string }): void {
    this.allItems
      ? this.value = {
        phoneCode: this.allItems?.find(x => x.label === value?.phoneCode)?.label,
        phoneNumber: value?.phoneNumber,
        //labelCode: this.allItems?.find(x => x.label === value?.phoneCode)?.flag
      }
      : this.value = {...this.value, phoneNumber: value?.phoneNumber, phoneCode: value?.phoneCode};
    this.onChange(this.value);
    this.ref.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allItems']) {
      // this.phone = this.allItems?.find(x => x.label === this.value?.phoneCode);
      this.ref.detectChanges();
    }

  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  selectItem(evt: { code: string; label: string }) {
    this.onChange({phoneCode: evt?.label, phoneNumber: this.value?.phoneNumber});
    this.value = {
      phoneCode: evt?.label,
      phoneNumber: this.value?.phoneNumber,
      //labelCode: evt?.code
    };
    this.onTouched();
  }

  filterSearch(evt: any) {
    this.filter = evt.target?.value;
  }

  closeMatSelect() {
    this.filter = null;
    this.onTouched();
  }

  openMatSelect(matSelect: any): void {
    if (!this.isDisabled) {
      matSelect.open();
    }
  }

  changeValue(phoneNumber: string) {
    this.onChange({phoneCode: this.value?.phoneCode, phoneNumber: phoneNumber});
    this.value = {
      phoneCode: this.value.phoneCode,
      phoneNumber: phoneNumber,
      //labelCode: this.value?.labelCode
    };
    this.onTouched();
  }
}
