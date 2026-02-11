import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HotelExpandEnum } from '@app/core/graphql/generated/graphql';
import { HotelConfigService } from '@app/services/hotel-config.service';
import {
  loadHotel,
  loadPropertyBrandingList,
  loadPropertyMainFont
} from '@app/store/hotel/hotel.actions';
import {
  RouteKeyQueryParams,
  RouterKeyParams,
  RouterPageKey
} from '@constants/RouteKey';
import { Store } from '@ngrx/store';

export const InitGuard: CanActivateFn = async (route, _state) => {
  const propertyCode: string =
    route.params[RouterKeyParams.hotelCode] ||
    route.queryParams[RouteKeyQueryParams.hotelCode];

  const router$$ = inject(Router);

  if (!(propertyCode?.length > 0)) {
    return await router$$.navigate(['home']);
  }

  const isPropertyCodeValid = /^GV[\w\d]{6}$/g.test(
    propertyCode?.toUpperCase()
  );

  if (!isPropertyCodeValid) {
    return await router$$.navigate(['message', '404']);
  }

  const configService$$ = inject(HotelConfigService);

  const store$$ = inject(Store);

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

  const hotelInfo = configService$$.hotel$.value;
  if (!hotelInfo) {
    store$$.dispatch(
      loadHotel({
        variables: {
          filter: {
            hotelCode: propertyCode?.toUpperCase(),
            expand: [
              HotelExpandEnum.Country,
              HotelExpandEnum.Currency,
              HotelExpandEnum.CurrencyRate,
              HotelExpandEnum.HotelConfiguration,
              HotelExpandEnum.IconImage
            ],
            pageSize: 1,
            pageIndex: 0
          }
        }
      })
    );
  }

  const targetRoutes = [RouterPageKey.recommendation];
  return await router$$.navigate(targetRoutes, {
    queryParams: {
      [RouteKeyQueryParams.hotelCode]: propertyCode?.toUpperCase(),
      ...route?.queryParams
    },
    queryParamsHandling: 'merge'
  });
};
