import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { InputTextareaComponent } from '@app/shared/form-controls/input-textarea/input-textarea.component';
import { FormErrorComponent } from '@app/shared/form-controls/form-error/form-error.component';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { CustomRadioButtonComponent } from '@app/shared/form-controls/custom-radio-button/custom-radio-button.component';
import { InputComponent } from '@app/shared/form-controls/input/input.component';
import { SelectSingleControlCountryComponent } from '@app/shared/form-controls/select-single-control-country/select-single-control-country.component';
import { select, Store } from '@ngrx/store';
import { selectorLocation } from '@store/hotel/hotel.selectors';
import { BehaviorSubject, debounceTime, Observable } from 'rxjs';
import { Country } from '@core/graphql/generated/graphql';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
  tap
} from 'rxjs/operators';
import { ILocation } from '@models/location';
import { HotelService } from '@app/apis/hotel.service';

@Component({
  selector: 'app-trip-purpose',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    ReactiveFormsModule,
    InputTextareaComponent,
    FormErrorComponent,
    CustomRadioButtonComponent,
    InputComponent,
    SelectSingleControlCountryComponent
  ],
  templateUrl: './trip-purpose.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripPurposeComponent implements OnInit {
  fb = inject(FormBuilder);
  store = inject(Store);
  hotelService = inject(HotelService);
  cd = inject(ChangeDetectorRef);
  purposeCtrl = new FormControl('Leisure');

  tripPurposes = [
    {
      label: 'TRIP_PURPOSE_MSG_OPT_1',
      value: 'Business'
    },
    {
      label: 'TRIP_PURPOSE_MSG_OPT_2',
      value: 'Leisure'
    }
  ];

  location$ = this.store.pipe(select(selectorLocation));

  countries$: Observable<Country[]> = this.hotelService.countryList().pipe(
    shareReplay(),
    switchMap((countries: Country[]) =>
      this.location$.pipe(
        map((location: ILocation) => ({ countries, location }))
      )
    ),
    map(({ countries, location }) => countries)
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

  rfSpecialRequest = this.fb.group({
    specialRequest: this.fb.control('', Validators.maxLength(250))
  });

  rfCompany = this.fb.group({
    taxId: this.fb.control(null),
    companyName: this.fb.control(null),
    companyEmail: this.fb.control(null, Validators.compose([Validators.email])),
    address: this.fb.control(null),
    city: this.fb.control(null),
    country: this.fb.control(null),
    postalCode: this.fb.control(null)
  });

  mandatoryField = ['companyName', 'address', 'city', 'country', 'postalCode'];
  hasRequired = new BehaviorSubject(false);

  ngOnInit(): void {
    this.rfCompany.valueChanges
      ?.pipe(
        debounceTime(300),
        distinctUntilChanged(
          (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
        )
      )
      ?.subscribe((res) => {
        const checkInfo = Object.keys(res)
          ?.map((x) => !!res[x])
          ?.some((x) => !!x);
        this.mandatoryField.forEach((a) => {
          this.updateRequiredField(checkInfo, a);
        });
        this.hasRequired.next(checkInfo);
        this.cd.detectChanges();
      });
  }

  updateRequiredField(value: boolean, field: string) {
    if (value) {
      this.rfCompany.get(field).addValidators([Validators.required]);
    } else {
      this.rfCompany.get(field).clearValidators();
    }
    this.rfCompany.get(field).updateValueAndValidity();
  }
}
