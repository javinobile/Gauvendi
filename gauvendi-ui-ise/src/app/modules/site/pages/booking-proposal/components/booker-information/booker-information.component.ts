import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges, OnInit,
  SimpleChanges, ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {FormErrorComponent} from "@app/shared/form-controls/form-error/form-error.component";
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {InputComponent} from "@app/shared/form-controls/input/input.component";
import {
  InputCustomPhoneNumberComponent
} from "@app/shared/form-controls/input-custom-phone-number/input-custom-phone-number.component";
import {select, Store} from "@ngrx/store";
import {selectorLocation} from "@store/hotel/hotel.selectors";
import {Observable, Subject, takeUntil} from "rxjs";
import {Country, Guest} from "@core/graphql/generated/graphql";
import {map, shareReplay, switchMap, tap} from "rxjs/operators";
import {ILocation} from "@models/location";
import {HotelService} from "@app/apis/hotel.service";
import {HotelConfigService} from "@app/services/hotel-config.service";
import {
  SelectSingleControlCountryComponent
} from "@app/shared/form-controls/select-single-control-country/select-single-control-country.component";
import {CheckboxCComponent} from "@app/shared/form-controls/checkbox-c/checkbox-c.component";
import {MatExpansionModule, MatExpansionPanel} from "@angular/material/expansion";
import {MatIconModule} from "@angular/material/icon";

@Component({
  selector: 'app-booker-information',
  standalone: true,
  imports: [CommonModule, TranslatePipe, FormErrorComponent, FormsModule, InputComponent, ReactiveFormsModule, InputCustomPhoneNumberComponent, SelectSingleControlCountryComponent, CheckboxCComponent, MatExpansionModule, MatIconModule],
  templateUrl: './booker-information.component.html',
  styleUrls: ['./booker-information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookerInformationComponent implements OnChanges, OnInit {
  @ViewChild('expansionPanel', {static: true}) expansionPanel: MatExpansionPanel;
  @Input() booker: Guest;
  @Input() needValidation: boolean;
  @Input() mandatoryAddressMainGuest;
  @Input() isBookForOther: boolean;

  fb = inject(FormBuilder);
  store = inject(Store);
  hotelService = inject(HotelService);
  hotelConfigService = inject(HotelConfigService);
  cd = inject(ChangeDetectorRef);
  rf = this.fb.group({
    firstName: this.fb.control(null, Validators.compose([Validators.required, Validators.maxLength(50)])),
    lastName: this.fb.control(null, Validators.compose([Validators.required, Validators.maxLength(50)])),
    phoneNumber: this.fb.control(null, Validators.compose([Validators.required, this.checkRequirePhoneNumber()])),
    bookForAnother: [false],
    country: this.fb.control(null),
    // state: this.fb.control(null),
    address: this.fb.control(null, Validators.maxLength(200)),
    city: this.fb.control(null),
    postalCode: this.fb.control(null, Validators.maxLength(15))
  });

  location$ = this.store.pipe(select(selectorLocation));
  countries$: Observable<Country[]> = this.hotelService.countryList().pipe(
    shareReplay(),
    switchMap((countries: Country[]) => this.location$.pipe(
      map((location: ILocation) => ({countries, location})),
    )),
    map(({countries, location}) => countries),
  );

  countriesParse$: Observable<{ code: string, label: string; flag: string; }[]> = this.countries$.pipe(
    map((data) => data?.map(item => ({
      code: item?.id,
      label: item?.name,
      flag: item?.code?.toLocaleLowerCase(),
    }))));

  countriesPhone$: Observable<{ code: string, label: string; flag: string; metaData?: any }[]> = this.countries$.pipe(
    map((data) => data?.map(item => ({
      code: item?.code?.toLocaleLowerCase(),
      label: item?.phoneCode,
      flag: item?.code?.toLocaleLowerCase(),
      metaData: {
        label: `${item?.phoneCode} - ${item?.name}`
      }
    }))?.sort((prev, next) => prev?.label?.localeCompare(next?.label, undefined, {
      numeric: true,
      sensitivity: 'base'
    }))),
    switchMap((data) => this.location$.pipe(
      tap(location => {
        const countryCode = location?.country?.toLocaleLowerCase() || this.hotelConfigService.defaultNation?.value?.toLocaleLowerCase() || 'de';
        const defaultPhone = data?.find(x => x?.code === countryCode);

        // @ts-ignore
        this.rf.get('phoneNumber').patchValue({
          phoneCode: this.booker?.countryNumber || defaultPhone?.label,
          phoneNumber: this.booker?.phoneNumber
        });
      }),
      map(() => data),
    )),
  );

  destroyed$ = new Subject();

  checkRequirePhoneNumber(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      let phoneNumberVal = control?.value?.['phoneNumber'];
      let phoneCodeVal = control?.value?.['phoneCode'];
      if (typeof phoneNumberVal === 'string') {
        phoneNumberVal = `${phoneNumberVal}`;
      }
      if (typeof phoneCodeVal === 'string') {
        phoneCodeVal = `${phoneCodeVal}`;
      }
      let isValid = (phoneNumberVal || '').length > 0 && (phoneCodeVal || '').length > 0;
      return isValid ? null : {phoneNumberRequired: true};
    };
  }

  ngOnInit(): void {
    // this.rf.get('bookForAnother').valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
    //   value ? this.expansionPanel?.close() : this.expansionPanel?.open();
    // });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('booker') && this.booker) {
      this.rf.patchValue({
        firstName: this.booker?.firstName,
        lastName: this.booker?.lastName,
        address: this.booker?.address,
        city: this.booker?.city,
        postalCode: this.booker?.postalCode,
        country: this.booker?.countryId,
        phoneNumber: {
          phoneCode: this.booker?.countryNumber,
          phoneNumber: this.booker?.phoneNumber,
        },
      });

      this.rf.updateValueAndValidity();
    }

    if (changes.hasOwnProperty('needValidation') && this.needValidation) {
      this.rf.markAllAsTouched();
      this.rf.updateValueAndValidity();
    }

    if (changes.hasOwnProperty('mandatoryAddressMainGuest') && this.mandatoryAddressMainGuest) {
      this.mandatoryAddressMainGuest?.address
        ? this.rf?.get('address')?.addValidators(Validators.required)
        : this.rf.get('address')?.removeValidators(Validators.required);
      this.rf?.get('address')?.updateValueAndValidity();
      this.mandatoryAddressMainGuest?.city
        ? this.rf?.get('city')?.addValidators(Validators.required)
        : this.rf.get('city')?.removeValidators(Validators.required);
      this.rf?.get('city')?.updateValueAndValidity();
      this.mandatoryAddressMainGuest?.postalCode
        ? this.rf?.get('postalCode')?.addValidators(Validators.required)
        : this.rf.get('postalCode')?.removeValidators(Validators.required);
      this.rf?.get('postalCode')?.updateValueAndValidity();
    }

    if (changes.hasOwnProperty('isBookForOther')) {
      this.rf.get('bookForAnother').patchValue(this.isBookForOther);
    }
  }
}
