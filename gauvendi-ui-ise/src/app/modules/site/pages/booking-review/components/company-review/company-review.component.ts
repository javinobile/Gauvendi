import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input
} from '@angular/core';
import { HotelService } from '@app/apis/hotel.service';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { Country, Guest } from '@core/graphql/generated/graphql';
import { ILocation } from '@models/location';
import { select, Store } from '@ngrx/store';
import { selectorLocation } from '@store/hotel/hotel.selectors';
import { Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-company-review',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './company-review.component.html',
  styleUrls: ['./company-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyReviewComponent {
  @Input() booker: Guest;

  hotelService = inject(HotelService);
  store = inject(Store);

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

  countriesName$: Observable<string> = this.countries$.pipe(
    map(
      (data) => data?.find((x) => x?.id === this.booker?.companyCountry)?.name
    )
  );
}
