import { Injectable } from '@angular/core';
import { CalendarService } from '@app/apis/calendar.service';
import { CalendarDailyRate } from '@core/graphql/generated/graphql';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  loadCalendar,
  loadCalendarDirectRoom,
  loadCalendarWithCheckin,
  loadDailyRate,
  loadedCalendarDirectRoomSuccessfully,
  loadedCalendarSuccess,
  loadedCalendarWithCheckinSuccess,
  loadedDailyRateSuccess
} from '@store/calendar/calendar.actions';
import {
  debounceTime,
  filter,
  map,
  switchMap,
  takeUntil
} from 'rxjs/operators';

@Injectable()
export class CalendarEffects {
  constructor(
    private calendarService: CalendarService,
    private actions$: Actions
  ) {}

  calendarDailyRateList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCalendar),
      debounceTime(800),
      switchMap(({ variables, cachingTime }) => {
        const cancel$ = this.actions$.pipe(
          ofType(loadCalendar),
          filter(
            ({ variables: newVariables }) =>
              JSON.stringify(newVariables) !== JSON.stringify(variables)
          )
        );

        return this.calendarService
          .calendarDailyRateList({ filter: variables })
          .pipe(
            takeUntil(cancel$),
            map((result) =>
              loadedCalendarSuccess({
                result: result.data as CalendarDailyRate[],
                cachingTime
              })
            )
          );
      })
    )
  );

  loadDailyRate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadDailyRate),
      debounceTime(500),
      switchMap(({ variables }) =>
        this.calendarService.calendarDailyRateList({ filter: variables }).pipe(
          map((result) =>
            loadedDailyRateSuccess({
              result: result.data as CalendarDailyRate[]
            })
          )
        )
      )
    )
  );

  loadCalendarDirectRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCalendarDirectRoom),
      debounceTime(500),
      switchMap(({ variables, cachingTime }) => {
        const cancel$ = this.actions$.pipe(
          ofType(loadCalendarDirectRoom),
          filter(
            ({ variables: newVariables }) =>
              JSON.stringify(newVariables) !== JSON.stringify(variables)
          )
        );
        return this.calendarService
          .calendarDailyRateList({ filter: variables })
          .pipe(
            takeUntil(cancel$),
            map((result) =>
              loadedCalendarDirectRoomSuccessfully({
                result: result.data as CalendarDailyRate[],
                cachingTime
              })
            )
          );
      })
    )
  );

  loadCalendarWithCheckIn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCalendarWithCheckin),
      debounceTime(500),
      switchMap(({ variables }) =>
        this.calendarService.calendarDailyRateList({ filter: variables }).pipe(
          map((result) =>
            loadedCalendarWithCheckinSuccess({
              result: result.data as CalendarDailyRate[]
            })
          )
        )
      )
    )
  );
}
