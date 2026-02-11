import {createFeatureSelector, createSelector} from "@ngrx/store";
import {CalendarDailyRate} from "@core/graphql/generated/graphql";
import {CALENDAR_FEATURE_KEY, CalendarState} from "@store/calendar/calendar.state";
import {ELoadingStatus} from "@models/loading-status.model";

export const selectCalendarState = createFeatureSelector<CalendarState>(CALENDAR_FEATURE_KEY);

export const selectorCalendarDailyRateList = createSelector(
  selectCalendarState,
  (res: CalendarState) => res?.calendarDailyRate?.data as CalendarDailyRate[]
);

export const selectorCalendarDailyRateListStatus = createSelector(
  selectCalendarState,
  (res: CalendarState) => res?.calendarDailyRate?.status
);

export const selectorDailyRateCkInOutPeriod = createSelector(
  selectCalendarState,
  (res: CalendarState) => res?.dailyRateCheckInOutPeriod?.data
);

export const selectorCalendarDirectRoom = createSelector(
  selectCalendarState,
  (res: CalendarState) => res?.calendarDirectRoom?.data
);

export const selectorLoadingCalendarDirectRoom = createSelector(
  selectCalendarState,
  (res: CalendarState) => res?.calendarDirectRoom?.status === ELoadingStatus.loading
);

export const selectorCalendarRateCheckIn = createSelector(
  selectCalendarState,
  (res: CalendarState) => res?.calendarRateWithCheckin?.data
);
