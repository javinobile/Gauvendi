import {ChangeDetectionStrategy, Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {select, Store} from "@ngrx/store";
import {selectorLocation} from "@store/hotel/hotel.selectors";
import {Observable} from "rxjs";
import {BookingFlow, Country, Guest, Reservation} from "@core/graphql/generated/graphql";
import {map, shareReplay, switchMap, tap} from "rxjs/operators";
import {ILocation} from "@models/location";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {HotelService} from "@app/apis/hotel.service";
import {HotelConfigService} from "@app/services/hotel-config.service";
import {FormErrorComponent} from "@app/shared/form-controls/form-error/form-error.component";
import {InputComponent} from "@app/shared/form-controls/input/input.component";
import {
  InputCustomPhoneNumberComponent
} from "@app/shared/form-controls/input-custom-phone-number/input-custom-phone-number.component";
import {
  SelectSingleControlCountryComponent
} from "@app/shared/form-controls/select-single-control-country/select-single-control-country.component";
import {InputTextareaComponent} from "@app/shared/form-controls/input-textarea/input-textarea.component";
import {ParseFormGroupPipe} from "@app/shared/pipes/parse-form-group.pipe";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatIconModule} from "@angular/material/icon";
import {HexToRgbaPipe} from "@app/shared/pipes/hex-to-rgba.pipe";
import {GetOrdinaryGuestPipe} from "@app/modules/site/pages/booking-proposal/pipes/get-ordinary-guest.pipe";

@Component({
  selector: 'app-guest-information',
  standalone: true,
  imports: [CommonModule, TranslatePipe, FormErrorComponent, FormsModule, InputComponent, InputCustomPhoneNumberComponent, ReactiveFormsModule, SelectSingleControlCountryComponent, InputTextareaComponent, ParseFormGroupPipe, MatExpansionModule, MatIconModule, HexToRgbaPipe, GetOrdinaryGuestPipe],
  templateUrl: './guest-information.component.html',
  styleUrls: ['./guest-information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuestInformationComponent implements OnChanges {
  @Input() guestList: Guest[];
  @Input() mandatoryAddressMainGuest;
  @Input() totalAdults: number;
  @Input() totalChildren: number;
  @Input() specialRequest: string;
  @Input() needValidation: boolean;
  @Input() isSameBooker: boolean;
  @Input() isBookForAnother: boolean;
  @Input() reservationList: Reservation[];
  @Input() colorPrimary: string;
  @Input() isLowestPriceOpaque: boolean;

  fb = inject(FormBuilder);
  store = inject(Store);
  hotelService = inject(HotelService);
  hotelConfigService = inject(HotelConfigService);
  defaultNation: string;

  location$ = this.store.pipe(select(selectorLocation));
  countries$: Observable<Country[]> = this.hotelService.countryList().pipe(
    shareReplay(),
    switchMap((countries: Country[]) => this.location$.pipe(
      map((location: ILocation) => ({countries, location})),
    )),
    tap(res => this.setDefaultCountry(res)),
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

        if (!this.rf.get('phoneNumber')?.value?.phoneCode) {
          // @ts-ignore
          this.rf.get('phoneNumber').patchValue({
            phoneCode: defaultPhone?.label
          });
        }
      }),
      map(() => data),
    )),
  );

  rf = this.fb.group({
    firstName: this.fb.control(null, Validators.compose([Validators.required, Validators.maxLength(50)])),
    lastName: this.fb.control(null, Validators.compose([Validators.required, Validators.maxLength(50)])),
    email: this.fb.control(null, Validators.compose([Validators.required, Validators.email])),
    country: this.fb.control(null),
    // state: this.fb.control(null),
    address: this.fb.control(null, Validators.maxLength(200)),
    city: this.fb.control(null),
    postalCode: this.fb.control(null, Validators.maxLength(15)),
    phoneNumber: this.fb.control(null, Validators.compose([Validators.required, this.checkRequirePhoneNumber()]))
  });

  rfAdditional = this.fb.array([]);

  additionalGuestListFrm(index: number): FormArray {
    return this.rfAdditional?.at(index).get('guestList') as FormArray;
  }

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

  setDefaultCountry({countries, location}: { countries: Country[], location: ILocation }): void {
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

      if (!primaryGuest?.isBooker) {
        this.rf.patchValue({
          firstName: primaryGuest?.firstName,
          lastName: primaryGuest?.lastName,
          email: primaryGuest?.emailAddress,
          address: primaryGuest?.address,
          city: primaryGuest?.city,
          postalCode: primaryGuest?.postalCode,
          country: primaryGuest?.countryId,
          phoneNumber: {
            phoneCode: primaryGuest?.countryNumber,
            phoneNumber: primaryGuest?.phoneNumber,
          },
        });
      }

      this.rf.updateValueAndValidity();
    }

    if (changes.hasOwnProperty('reservationList') && this.reservationList?.length > 0) {
      this.rfAdditional?.clear();
      const primaryGuestId = this.guestList?.[0]?.id;
      this.reservationList?.forEach((rs, index) => {
        // @ts-ignore
        this.rfAdditional.push(this.fb.group({
          reservationId: rs?.id,
          guestList: this.fb.array([])
        }));

        const allGuests = [
          rs?.primaryGuest,
          ...rs?.additionalGuest
        ]?.filter(x => x?.id !== primaryGuestId);

        let adultCount = rs?.adult;
        if (rs?.primaryGuest?.id === primaryGuestId) {
          adultCount = rs?.adult - 1;
        }

        const guestListArr = this.rfAdditional.at(index)?.get('guestList') as FormArray;
        const adultGuests = allGuests?.filter(x => x?.isAdult);
        const childGuests = allGuests?.filter(x => !x?.isAdult);

        for (let i = 0; i < adultCount; i++) {
          const guest = adultGuests[i];
          // @ts-ignore
          guestListArr.push(this.fb.group({
            firstName: [guest?.firstName, [Validators.maxLength(50), Validators.required]],
            lastName: [guest?.lastName, [Validators.maxLength(50), Validators.required]],
            isAdult: [true],
            id: [guest?.id]
          }))
        }

        for (let i = 0; i < rs?.childrenAgeList?.length; i++) {
          const guest = childGuests[i];
          // @ts-ignore
          guestListArr.push(this.fb.group({
            firstName: [guest?.firstName, [Validators.maxLength(50), Validators.required]],
            lastName: [guest?.lastName, [Validators.maxLength(50), Validators.required]],
            isAdult: [false],
            id: [guest?.id]
          }))
        }
      });

      this.rfAdditional.updateValueAndValidity();
    }
  }
  changeValue(firstNameVal: string, index: number, rfGuests): void {
    const formItem = rfGuests?.at(index);
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

  protected readonly bookingFlow = BookingFlow;
}
