import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { HotelService } from '@app/apis/hotel.service';
import { IRoomSummary } from '@app/models/common.model';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { RoomSummaryLabelComponent } from '@app/shared/components/room-summary-label/room-summary-label.component';
import { CheckboxCComponent } from '@app/shared/form-controls/checkbox-c/checkbox-c.component';
import { FormErrorComponent } from '@app/shared/form-controls/form-error/form-error.component';
import { InputCustomPhoneNumberComponent } from '@app/shared/form-controls/input-custom-phone-number/input-custom-phone-number.component';
import { InputComponent } from '@app/shared/form-controls/input/input.component';
import { SelectSingleControlCountryComponent } from '@app/shared/form-controls/select-single-control-country/select-single-control-country.component';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  BookingPricing,
  Country,
  ReservationPricing,
  RoomRequest
} from '@core/graphql/generated/graphql';
import { DropdownItem } from '@models/dropdown-item.model';
import { ILocation } from '@models/location';
import { select, Store } from '@ngrx/store';
import { selectorLocation } from '@store/hotel/hotel.selectors';
import { Observable } from 'rxjs';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-booking-information',
  standalone: true,
  imports: [
    CheckboxCComponent,
    CommonModule,
    FormErrorComponent,
    InputComponent,
    InputCustomPhoneNumberComponent,
    MatExpansionModule,
    MatIconModule,
    ReactiveFormsModule,
    SelectSingleControlCountryComponent,
    TranslatePipe,
    RoomSummaryLabelComponent
  ],
  templateUrl: './booking-information.component.html',
  styleUrls: ['./booking-information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingInformationComponent implements OnChanges, OnInit {
  @Input() booking: BookingPricing;
  @Input() childrenFiltered: RoomRequest[];
  @Input() mandatoryAddressMainGuest;
  @Input() needValidation: boolean;
  roomSummary = input<IRoomSummary>();

  location$ = this.store.pipe(select(selectorLocation));

  countries$: Observable<Country[]> = this.hotelService.countryList().pipe(
    switchMap((countries: Country[]) =>
      this.location$.pipe(
        map((location: ILocation) => ({ countries, location }))
      )
    ),
    tap((res) => this.setDefaultCountry(res)),
    map(({ countries }) => countries),
    shareReplay()
  );

  countriesParse$: Observable<{ code: string; label: string; flag: string }[]> =
    this.countries$.pipe(
      map((data) =>
        data?.map((item) => ({
          code: item?.id,
          label: item?.name,
          flag: item?.code?.toLocaleLowerCase()
        }))
      )
    );

  countriesPhone$: Observable<DropdownItem[]> = this.countries$.pipe(
    map((data) =>
      data
        ?.map((item) => ({
          code: item?.code?.toLocaleLowerCase(),
          label: item?.phoneCode,
          flag: item?.code?.toLocaleLowerCase(),
          metaData: {
            label: `${item?.phoneCode} - ${item?.name}`
          }
        }))
        ?.sort((prev, next) =>
          prev?.label?.localeCompare(next?.label, undefined, {
            numeric: true,
            sensitivity: 'base'
          })
        )
    )
  );

  bookForAnotherCtl = new FormControl(false);

  rfBooker = this.fb.group({
    firstName: this.fb.control(
      null,
      Validators.compose([Validators.required, Validators.maxLength(50)])
    ),
    lastName: this.fb.control(
      null,
      Validators.compose([Validators.required, Validators.maxLength(50)])
    ),
    email: this.fb.control(
      null,
      Validators.compose([Validators.required, Validators.email])
    ),
    country: this.fb.control(null),
    state: this.fb.control(null),
    address: this.fb.control(null, Validators.maxLength(200)),
    city: this.fb.control(null),
    postalCode: this.fb.control(null, Validators.maxLength(15)),
    phoneNumber: this.fb.control(
      null,
      Validators.compose([Validators.required, this.checkRequirePhoneNumber()])
    )
  });

  rfGuest = this.fb.group({
    firstName: this.fb.control(
      null,
      Validators.compose([Validators.required, Validators.maxLength(50)])
    ),
    lastName: this.fb.control(
      null,
      Validators.compose([Validators.required, Validators.maxLength(50)])
    ),
    email: this.fb.control(
      null,
      Validators.compose([Validators.required, Validators.email])
    ),
    country: this.fb.control(null),
    state: this.fb.control(null),
    address: this.fb.control(null, Validators.maxLength(200)),
    city: this.fb.control(null),
    postalCode: this.fb.control(null, Validators.maxLength(15)),
    phoneNumber: this.fb.control(
      null,
      Validators.compose([Validators.required, this.checkRequirePhoneNumber()])
    )
  });

  rfAdditional: FormArray<any> = this.fb.array([]);

  adultCounter = signal<number>(0);
  childCounter = signal<number>(0);
  roomSummaryList = signal<IRoomSummary[]>([]);

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
      let isValid =
        (phoneNumberVal || '').length > 0 && (phoneCodeVal || '').length > 0;
      return isValid ? null : { phoneNumberRequired: true };
    };
  }

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private hotelService: HotelService,
    private hotelConfigService: HotelConfigService
  ) {}

  ngOnInit(): void {
    this.countriesPhone$
      .pipe(
        switchMap((countriesPhone) =>
          this.location$.pipe(map((location) => ({ location, countriesPhone })))
        ),
        take(1)
      )
      .subscribe(({ location, countriesPhone }) => {
        const countryCode =
          location?.country?.toLocaleLowerCase() ||
          this.hotelConfigService.defaultNation?.value?.toLocaleLowerCase() ||
          'de';
        const defaultPhone = countriesPhone?.find(
          (x) => x?.code === countryCode
        );
        this.rfBooker.get('phoneNumber').patchValue({
          phoneCode: defaultPhone?.label
        });
        this.rfGuest.get('phoneNumber').patchValue({
          phoneCode: defaultPhone?.label
        });
      });

    this.rfGuest.valueChanges.subscribe({
      next: ({ firstName, lastName }) => {
        if (this.rfAdditional.controls?.length > 0) {
          const res1FrmGrp = this.rfAdditional?.controls?.[0] as FormGroup<any>;
          const res1guestListFrmArr = res1FrmGrp?.get(
            'guestList'
          ) as FormArray<any>;
          if (res1guestListFrmArr?.controls?.length > 0) {
            res1guestListFrmArr?.controls?.[0]?.patchValue({
              firstName,
              lastName
            });
          }
        }
      }
    });
  }

  initForm(): void {
    if (!!this.booking && this.booking?.reservationPricingList?.length > 0) {
      this.adultCounter.set(0);
      this.childCounter.set(0);
      const roomSummaryList = [];
      this.booking?.reservationPricingList?.forEach((res, index) => {
        this.generateAdditionalGuest(res, index);
        roomSummaryList.push({
          adults: res?.adults,
          children: res?.childrenAgeList?.length,
          pets: res?.allocatedPets
        });
      });
      this.roomSummaryList.set(roomSummaryList);
    }
  }

  generateAdditionalGuest(res: ReservationPricing, index: number): void {
    this.rfAdditional.push(
      this.fb.group({
        index,
        name: res?.roomProduct?.name,
        adults: res?.adults,
        children: res?.childrenAgeList?.length,
        guestList: this.generateAdditionalGuestByReservation(
          res?.adults,
          res?.childrenAgeList
        )
      })
    );
  }

  generateAdditionalGuestByReservation(
    adults: number,
    childrenAgeList: number[]
  ): FormArray<any> {
    const formArr: FormArray<any> = this.fb.array([]);
    for (let i = 0; i < adults; i++) {
      formArr.push(this.generateAdditionalGuestForm(true));
    }
    childrenAgeList.forEach((age) => {
      formArr.push(this.generateAdditionalGuestForm(false, age));
    });

    return formArr;
  }

  generateAdditionalGuestForm(isAdult: boolean, age?: number): FormGroup<any> {
    isAdult
      ? this.adultCounter.set(this.adultCounter() + 1)
      : this.childCounter.set(this.childCounter() + 1);
    const index = isAdult ? this.adultCounter() : this.childCounter();
    if (index === 1 && isAdult) {
      return this.fb.group({
        index,
        firstName: this.fb.control(
          this.rfGuest.get('firstName').value,
          Validators.compose([Validators.required, Validators.maxLength(50)])
        ),
        lastName: this.fb.control(
          this.rfGuest.get('lastName').value,
          Validators.compose([Validators.required, Validators.maxLength(50)])
        ),
        isAdult: [isAdult],
        age
      });
    }
    return this.fb.group({
      index,
      firstName: this.fb.control(
        null,
        Validators.compose([Validators.required, Validators.maxLength(50)])
      ),
      lastName: this.fb.control(
        null,
        Validators.compose([Validators.required, Validators.maxLength(50)])
      ),
      isAdult: [isAdult],
      age
    });
  }

  additionGuest(_isCollapsed: boolean): void {
    this.rfAdditional?.clear();
    if (_isCollapsed) return;
    this.initForm();
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

  setDefaultCountry({
    countries,
    location
  }: {
    countries: Country[];
    location: ILocation;
  }): void {
    if (countries?.length > 0) {
      let found = countries?.find((item) => item?.code === location?.country);
      if (!found) {
        found = countries?.find(
          (item) => item?.code === this.hotelConfigService.defaultNation?.value
        );
      }

      this.rfBooker?.patchValue({
        country: found?.id
      });

      this.rfGuest?.patchValue({
        country: found?.id
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('needValidation') && this.needValidation) {
      this.rfBooker.markAllAsTouched();
      this.rfBooker.updateValueAndValidity();

      this.rfGuest.markAllAsTouched();
      this.rfGuest.updateValueAndValidity();

      this.rfAdditional.markAllAsTouched();
      this.rfAdditional.updateValueAndValidity();
    }

    if (
      changes.hasOwnProperty('mandatoryAddressMainGuest') &&
      this.mandatoryAddressMainGuest
    ) {
      this.mandatoryAddressMainGuest?.address
        ? this.rfBooker?.get('address')?.addValidators(Validators.required)
        : this.rfBooker.get('address')?.removeValidators(Validators.required);
      this.rfBooker?.get('address')?.updateValueAndValidity();
      this.mandatoryAddressMainGuest?.city
        ? this.rfBooker?.get('city')?.addValidators(Validators.required)
        : this.rfBooker.get('city')?.removeValidators(Validators.required);
      this.rfBooker?.get('city')?.updateValueAndValidity();
      this.mandatoryAddressMainGuest?.postalCode
        ? this.rfBooker?.get('postalCode')?.addValidators(Validators.required)
        : this.rfBooker
            .get('postalCode')
            ?.removeValidators(Validators.required);
      this.rfBooker?.get('postalCode')?.updateValueAndValidity();

      this.mandatoryAddressMainGuest?.address
        ? this.rfGuest?.get('address')?.addValidators(Validators.required)
        : this.rfGuest.get('address')?.removeValidators(Validators.required);
      this.rfGuest?.get('address')?.updateValueAndValidity();
      this.mandatoryAddressMainGuest?.city
        ? this.rfGuest?.get('city')?.addValidators(Validators.required)
        : this.rfGuest.get('city')?.removeValidators(Validators.required);
      this.rfGuest?.get('city')?.updateValueAndValidity();
      this.mandatoryAddressMainGuest?.postalCode
        ? this.rfGuest?.get('postalCode')?.addValidators(Validators.required)
        : this.rfGuest.get('postalCode')?.removeValidators(Validators.required);
      this.rfGuest?.get('postalCode')?.updateValueAndValidity();
    }
  }

  resetValidation(): void {
    this.rfAdditional.clear();
  }
}
