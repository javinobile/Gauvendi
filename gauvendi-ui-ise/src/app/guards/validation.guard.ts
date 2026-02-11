import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import { loadNearestAvailable } from '@app/store/hotel/hotel.actions';
import { DateUtils } from '@app/utils/DateUtils';
import { Store } from '@ngrx/store';
import isValid from 'date-fns/isValid';
import parse from 'date-fns/parse';
import * as moment from 'moment';

export const ValidationGuard: CanActivateFn = (route, _state) => {
  const store$$ = inject(Store);

  const propertyCode: string = route.queryParams[RouteKeyQueryParams.hotelCode];

  const checkInDate = route.queryParams[RouteKeyQueryParams.checkInDate];
  const checkOutDate = route.queryParams[RouteKeyQueryParams.checkOutDate];
  if (checkInDate && checkOutDate) {
    const checkInDateParse = parse(checkInDate, 'dd-MM-yyyy', new Date());
    const checkOutDateParse = parse(checkOutDate, 'dd-MM-yyyy', new Date());

    if (!isValid(checkInDateParse) || !isValid(checkOutDateParse)) {
      store$$.dispatch(
        loadNearestAvailable({
          variables: {
            hotelCode: propertyCode?.toUpperCase(),
            fromDate: moment(DateUtils.safeDate(new Date()))
              .add(1, 'days')
              .format('yyyy-MM-DD')
          }
        })
      );
    }
  } else {
    store$$.dispatch(
      loadNearestAvailable({
        variables: {
          hotelCode: propertyCode?.toUpperCase(),
          fromDate: moment(DateUtils.safeDate(new Date()))
            .add(1, 'days')
            .format('yyyy-MM-DD')
        }
      })
    );
  }

  return true;
};
