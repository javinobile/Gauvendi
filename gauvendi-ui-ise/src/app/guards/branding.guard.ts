import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import { HotelConfigService } from '@app/services/hotel-config.service';
import {
  loadPropertyBrandingList,
  loadPropertyMainFont
} from '@app/store/hotel/hotel.actions';
import { selectorPropertyBranding } from '@app/store/hotel/hotel.selectors';
import { select, Store } from '@ngrx/store';
import { distinctUntilChanged, map, skipWhile } from 'rxjs';

export const BrandingGuard: CanActivateFn = (route, _state) => {
  const store$$ = inject(Store);

  const propertyCode: string = route.queryParams[RouteKeyQueryParams.hotelCode];

  const configService$$ = inject(HotelConfigService);

  const hotelBranding = configService$$.hotelBranding$.value;
  if (!hotelBranding) {
    store$$.dispatch(
      loadPropertyBrandingList({
        variables: { filter: { propertyCode: propertyCode?.toUpperCase() } }
      })
    );
  }

  const hotelFont = configService$$.hotelFontFamily.value;
  if (!hotelFont) {
    store$$.dispatch(
      loadPropertyMainFont({
        variables: { filter: { propertyCode: propertyCode?.toUpperCase() } }
      })
    );
  }

  return store$$.pipe(
    select(selectorPropertyBranding),
    skipWhile((data) => !data),
    distinctUntilChanged(),
    map((data) => !!data)
  );
};
