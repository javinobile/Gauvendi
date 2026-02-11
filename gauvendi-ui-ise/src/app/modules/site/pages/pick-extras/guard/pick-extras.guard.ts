import {CanActivateFn, Router} from '@angular/router';
import {RouteKeyQueryParams} from "@constants/RouteKey";
import {inject} from "@angular/core";

export const pickExtrasGuard: CanActivateFn = (route, state) => {
  const params = route.queryParams;
  const isValid = Boolean(params[RouteKeyQueryParams.numberOfRoom] &&
    params[RouteKeyQueryParams.checkOutDate] &&
    params[RouteKeyQueryParams.checkInDate] &&
    params[RouteKeyQueryParams.roomPlans]
  )

  if (isValid) {
    return true;
  } else {
    inject(Router).navigate(['message','404']).then();

    return false;
  }
};
