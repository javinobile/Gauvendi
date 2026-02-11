import {ChangeDetectionStrategy, Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators} from "@angular/forms";
import {FormErrorComponent} from "@app/shared/form-controls/form-error/form-error.component";
import {InputComponent} from "@app/shared/form-controls/input/input.component";
import {
  SelectSingleControlCountryComponent
} from "@app/shared/form-controls/select-single-control-country/select-single-control-country.component";
import {select, Store} from "@ngrx/store";
import {selectorLocation} from "@store/hotel/hotel.selectors";
import {Observable} from "rxjs";
import {Country, Guest} from "@core/graphql/generated/graphql";
import {map, shareReplay, switchMap, tap} from "rxjs/operators";
import {ILocation} from "@models/location";
import {HotelService} from "@app/apis/hotel.service";
import {HotelConfigService} from "@app/services/hotel-config.service";
import {CheckboxCComponent} from "@app/shared/form-controls/checkbox-c/checkbox-c.component";
import {MatIconModule} from "@angular/material/icon";
import {MatExpansionModule} from "@angular/material/expansion";

@Component({
  selector: 'app-company-information',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ReactiveFormsModule, FormErrorComponent, InputComponent, SelectSingleControlCountryComponent, CheckboxCComponent, MatIconModule, MatExpansionModule],
  templateUrl: './company-information.component.html',
  styleUrls: ['./company-information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyInformationComponent implements OnChanges {
  @Input() booker: Guest;

  fb = inject(FormBuilder);
  store = inject(Store);
  hotelService = inject(HotelService);
  hotelConfigService = inject(HotelConfigService);
  rf = this.fb.group({
    taxId: this.fb.control(null),
    companyName: this.fb.control(null),
    companyEmail: this.fb.control(null, Validators.compose([this.validateEmail])),
    address: this.fb.control(null),
    city: this.fb.control(null),
    country: this.fb.control(null),
    postalCode: this.fb.control(null),
  });

  validateEmail(control: AbstractControl): ValidationErrors | null {
    const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/gi;
    return control?.value?.length > 0
      ? emailPattern.test(control?.value)
        ? null
        : {emailPattern: 'Not matched'}
      : null;
  }

  location$ = this.store.pipe(select(selectorLocation));
  countries$: Observable<Country[]> = this.hotelService.countryList().pipe(
    shareReplay(),
    switchMap((countries: Country[]) => this.location$.pipe(
      map((location: ILocation) => ({ countries, location })),
    )),
    // tap(res => this.setDefaultCountry(res)),
    map(({ countries, location }) => countries),
  );

  countriesParse$: Observable<{ code: string, label: string; flag: string; }[]> = this.countries$.pipe(
    map((data) => data?.map(item => ({
      code: item?.id,
      label: item?.name,
      flag: item?.code?.toLocaleLowerCase(),
    }))));

  setDefaultCountry({ countries, location }: { countries: Country[], location: ILocation }): void {
    if (countries?.length > 0 && !this.booker?.companyCountry) {
      let found = countries?.find(item => item?.code === location?.country);
      if (!found) {
        return;
        // found = countries?.find(item => item?.code === this.hotelConfigService.defaultNation?.value);
      }
      this.rf?.patchValue({
        country: found?.id,
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('booker') && this.booker) {
      this.rf.patchValue({
        taxId: this.booker?.companyTaxId,
        companyName: this.booker?.companyName,
        companyEmail: this.booker?.companyEmail,
        address: this.booker?.companyAddress,
        city: this.booker?.companyCity,
        country: this.booker?.companyCountry,
        postalCode: this.booker?.companyPostalCode,
      });
    }
  }
}
