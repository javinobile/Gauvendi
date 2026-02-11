import {CanActivateFn, Router} from '@angular/router';
import {RouteKeyQueryParams} from "@constants/RouteKey";
import {inject} from "@angular/core";

export const paymentResultGuard: CanActivateFn = (route, state) => {
  const params = route.queryParams;
  const isValid = Boolean(params[RouteKeyQueryParams.hotelCode] &&
    params[RouteKeyQueryParams.paymentId]
  )

  if (isValid) {
    return true;
  } else {
    inject(Router).navigate(['message','404']).then();

    return false;
  }
};
