import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors
} from "@angular/forms";
import {MatSelectModule} from "@angular/material/select";
import {CommonModule} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {FilterDropdownPipe} from "@app/shared/pipes/filter-dropdown.pipe";
import {DropdownItem} from "@models/dropdown-item.model";

@Component({
  selector: 'app-select-single-control',
  templateUrl: './select-single-control.component.html',
  styleUrls: ['./select-single-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSelectModule,
    ReactiveFormsModule,
    FilterDropdownPipe
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => SelectSingleControlComponent),
    },
  ],
})
export class SelectSingleControlComponent implements ControlValueAccessor, OnChanges {

  @Input() allItems: DropdownItem[];
  @Input() control: FormControl | AbstractControl;
  @Input() errors: ValidationErrors;
  @Input() isDisabled: boolean;
  @Input() isRequired: boolean;
  @Input() hasSearch = true;
  @Input() label: string;
  @Input() noSearchMessage: string;
  @Input() note: string;
  @Input() panelClass: string;
  @Input() placeHolder: string;
  @Input() customClass: string;

  value: DropdownItem;
  filter: string;

  constructor(private ref: ChangeDetectorRef) {
  }

  onChange = (value: string) => {
  };
  onTouched = () => {
  };

  writeValue(code: string): void {
    this.allItems
      ? this.value = this.allItems?.find(x => x.code === code)
      : this.value = {...this.value, code};
    this.onChange(this.value?.code);
    this.ref.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allItems']) {
      this.value = this.allItems?.find(x => x.code === this.value?.code);
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
    this.onChange(evt.code);
    this.value = evt;
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
}
