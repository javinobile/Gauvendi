import {createAction, props} from '@ngrx/store';
import {CalendarDailyRate, CalendarDailyRateFilter} from '@core/graphql/generated/graphql';

export const loadCalendar = createAction(
  '@Calendar view/ load calendar view',
  props<{ variables: CalendarDailyRateFilter; cachingTime: string; }>(),
);

export const loadedCalendarSuccess = createAction(
  '@Calendar view/ loaded calendar view success',
  props<{ result: CalendarDailyRate[]; cachingTime: string; }>(),
);

export const loadDailyRate = createAction(
  '@Calendar view/ load daily rate',
  props<{ variables: CalendarDailyRateFilter }>(),
);

export const loadedDailyRateSuccess = createAction(
  '@Calendar view/ loaded daily rate success',
  props<{ result: CalendarDailyRate[] }>(),
);

export const loadCalendarDirectRoom = createAction(
  '@Calendar view/ load calendar direct room',
  props<{ variables: CalendarDailyRateFilter; cachingTime: string; }>(),
);

export const loadedCalendarDirectRoomSuccessfully = createAction(
  '@Calendar view/ loaded calendar direct room successfully',
  props<{ result: CalendarDailyRate[]; cachingTime: string; }>(),
);

export const loadCalendarWithCheckin = createAction(
  '@Calendar view/ load calendar with check in',
  props<{ variables: CalendarDailyRateFilter; }>(),
);

export const loadedCalendarWithCheckinSuccess = createAction(
  '@Calendar view/ loaded calendar with checkin success',
  props<{ result: CalendarDailyRate[]; }>(),
);

export const resetCalendarWithCheckin = createAction(
  '@Calendar view/ reset calendar with check in'
);

