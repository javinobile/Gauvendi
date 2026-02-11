import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Country, Guest } from '@core/graphql/generated/graphql';
import { InputComponent } from '@app/shared/form-controls/input/input.component';
import {
  InputCustomPhoneNumberComponent,
} from '@app/shared/form-controls/input-custom-phone-number/input-custom-phone-number.component';
import { InputTextareaComponent } from '@app/shared/form-controls/input-textarea/input-textarea.component';
import { ParseFormGroupPipe } from '@app/shared/pipes/parse-form-group.pipe';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  SelectSingleControlCountryComponent,
} from '@app/shared/form-controls/select-single-control-country/select-single-control-country.component';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectorLocation } from '@store/hotel/hotel.selectors';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ILocation } from '@models/location';
import { HotelService } from '@app/apis/hotel.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { FormErrorComponent } from '@app/shared/form-controls/form-error/form-error.component';

@Component({
  selector: 'app-booking-proposal-information',
  standalone: true,
  imports: [CommonModule, InputComponent, InputCustomPhoneNumberComponent, InputTextareaComponent, ParseFormGroupPipe, ReactiveFormsModule, SelectSingleControlCountryComponent, TranslatePipe, FormErrorComponent],
  templateUrl: './booking-proposal-information.component.html',
  styleUrls: ['./booking-proposal-information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingProposalInformationComponent implements OnChanges {
  @Input() booker: Guest;
  @Input() totalAdults: number;
  @Input() totalChildren: number;
  @Input() needValidation: boolean;
  @Input() mandatoryAddressMainGuest;
  @Input() guestList: Guest[];
  @Input() specialRequest: string;

  location$ = this.store.pipe(select(selectorLocation));

  countries$: Observable<Country[]> = this.hotelService.countryList().pipe(
    shareReplay(),
    switchMap((countries: Country[]) => this.location$.pipe(
      map((location: ILocation) => ({ countries, location })),
    )),
    tap(res => this.setDefaultCountry(res)),
    map(({ countries, location }) => countries),
  );

  countriesParse$: Observable<{ code: string, label: string; flag: string; }[]> = this.countries$.pipe(
    map((data) => data?.map(item => ({
      code: item?.id,
      label: item?.name,
      flag: item?.code?.toLocaleLowerCase(),
    }))));

  countriesPhone$: Observable<{ code: string, label: string; flag: string; }[]> = this.countries$.pipe(
    map((data) => data?.map(item => ({
      code: item?.code?.toLocaleLowerCase(),
      label: item?.phoneCode,
      flag: item?.code?.toLocaleLowerCase(),
    }))?.sort((prev, next) => prev?.label?.localeCompare(next?.label, undefined, {numeric: true, sensitivity: 'base'}))),
    switchMap((data) => this.location$.pipe(
      tap(location => {
        const countryCode = location?.country?.toLocaleLowerCase() || this.hotelConfigService.defaultNation?.value?.toLocaleLowerCase() || 'de';
        const defaultPhone = data?.find(x => x?.code === countryCode);

        this.rf.get('phoneNumber').patchValue({
          phoneCode: this.guestList?.[0]?.countryNumber || defaultPhone?.label,
          phoneNumber: this.guestList?.[0]?.phoneNumber
        });
      }),
      map(() => data),
    )),
  );

  rf = this.fb.group({
    firstName: this.fb.control(null, Validators.compose([Validators.required, Validators.maxLength(50)])),
    lastName: this.fb.control(null, Validators.compose([Validators.required, Validators.maxLength(50)])),
    email: this.fb.control(null, Validators.compose([Validators.required, Validators.email])),
    country: this.fb.control(null),
    state: this.fb.control(null),
    address: this.fb.control(null, Validators.maxLength(200)),
    city: this.fb.control(null),
    postalCode: this.fb.control(null, Validators.maxLength(15)),
    phoneNumber: this.fb.control(null, Validators.compose([Validators.required, this.checkRequirePhoneNumber()])),
  });

  rfAdditional = this.fb.array([]);
  rfSpecialRequest = this.fb.group({
    specialRequest: ['', [Validators.maxLength(250)]],
  });

  defaultNation: string;

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
      return isValid ? null : { phoneNumberRequired: true };
    };
  }

  validateEmail(control: AbstractControl): ValidationErrors | null {
    const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/gi;
    return control?.value?.length > 0
      ? emailPattern.test(control?.value)
        ? null
        : { emailPattern: 'Not matched' }
      : null;
  }

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private hotelService: HotelService,
    private hotelConfigService: HotelConfigService,
  ) {
  }

  changeValue(firstNameVal: string, index: number): void {
    const formItem = this.rfAdditional?.at(index);
    if (firstNameVal && firstNameVal?.length > 0) {
      formItem.get('lastName')?.addValidators(Validators.required);
      formItem.get('lastName')?.updateValueAndValidity();
      formItem.get('lastName')?.markAllAsTouched();
    } else {
      formItem.get('lastName')?.removeValidators(Validators.required);
      formItem.get('lastName')?.updateValueAndValidity();
      formItem.get('lastName')?.markAllAsTouched();
    }
  }

  setDefaultCountry({ countries, location }: { countries: Country[], location: ILocation }): void {
    if (countries?.length > 0) {
      if (this.guestList?.length > 0) {
        this.defaultNation = countries?.find(x => x?.phoneCode === this.guestList[0]?.countryNumber)?.code || this.hotelConfigService.defaultNation?.value;
        const found = countries?.find(item => item?.id === this.guestList[0]?.countryId);
        this.rf?.patchValue({
          country: found?.id,
        });
      } else {
        let found = countries?.find(item => item?.code === location?.country);
        if (!found) {
          found = countries?.find(item => item?.code === this.hotelConfigService.defaultNation?.value);
        }
        this.rf?.patchValue({
          country: found?.id,
        });
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('needValidation') && this.needValidation) {
      this.rf.markAllAsTouched();
      this.rf.updateValueAndValidity();

      this.rfAdditional.markAllAsTouched();
      this.rfAdditional.updateValueAndValidity();

      this.rfSpecialRequest.markAllAsTouched();
      this.rfSpecialRequest.updateValueAndValidity();
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

    if (changes.hasOwnProperty('guestList') && this.guestList?.length > 0) {
      const primaryGuest = this.guestList[0];
      this.rf.patchValue({
        firstName: primaryGuest?.firstName,
        lastName: primaryGuest?.lastName,
        email: primaryGuest?.emailAddress,
        address: primaryGuest?.address,
        city: primaryGuest?.city,
        postalCode: primaryGuest?.postalCode,
        phoneNumber: {
          phoneCode: primaryGuest?.countryNumber,
          phoneNumber: primaryGuest?.phoneNumber,
        },
      });

      this.rf.updateValueAndValidity();

      if (this.guestList?.length < 2) {
        this.rfAdditional?.clear();
        for (let i = 0; i < this.totalAdults - 1; i++) {
          this.generateGuestAdditional(true);
        }

        for (let i = 0; i <= this.totalChildren - 1; i++) {
          this.generateGuestAdditional(false);
        }
      } else {
        this.rfAdditional?.clear();
        const additionGuest = this.guestList?.slice(1);
        for (let i = 0; i < this.totalAdults - 1; i++) {
          const additionGuestAdult = additionGuest.filter(x => x?.isAdult);
          this.generateGuestAdditional(true, additionGuestAdult[i]?.firstName || '', additionGuestAdult[i]?.lastName || '');
        }

        for (let i = 0; i <= this.totalChildren - 1; i++) {
          const additionGuestChild = additionGuest.filter(x => !x?.isAdult);
          this.generateGuestAdditional(false, additionGuestChild[i]?.firstName || '', additionGuestChild[i]?.lastName || '');
        }

        this.rfAdditional.updateValueAndValidity();
      }
    }

    if (changes.hasOwnProperty('specialRequest') && this.specialRequest) {
      this.rfSpecialRequest.patchValue({
        specialRequest: this.specialRequest,
      });

      this.rfSpecialRequest.updateValueAndValidity();
    }
  }

  generateGuestAdditional(isAdult: boolean, firstName = '', lastName = ''): void {
    // @ts-ignore
    this.rfAdditional.push(this.fb.group({
      firstName: [firstName, [Validators.maxLength(50), Validators.required]],
      lastName: [lastName, [Validators.maxLength(50), Validators.required]],
      isAdult: [isAdult],
    }));
  }
}
