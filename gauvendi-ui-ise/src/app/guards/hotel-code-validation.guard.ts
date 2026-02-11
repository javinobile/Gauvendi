import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';

export const HotelCodeValidationGuard: CanActivateFn = (route, _state) => {
  const propertyCode: string = route.queryParams[RouteKeyQueryParams.hotelCode];

  const isPropertyCodeValid =
    propertyCode?.length > 0 &&
    /^GV[\w\d]{6}$/g.test(propertyCode?.toUpperCase());

  if (!isPropertyCodeValid) {
    const router$$ = inject(Router);
    router$$.navigate(['message', '404']);
  }

  return true;
};
