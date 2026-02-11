import {ELoadingStatus} from "@models/loading-status.model";
import {Action, createReducer, on} from "@ngrx/store";
import {CalendarState} from "@store/calendar/calendar.state";
import {
  loadCalendar,
  loadCalendarDirectRoom,
  loadCalendarWithCheckin,
  loadedCalendarDirectRoomSuccessfully,
  loadedCalendarSuccess,
  loadedCalendarWithCheckinSuccess,
  loadedDailyRateSuccess,
  resetCalendarWithCheckin
} from "@store/calendar/calendar.actions";
import * as moment from "moment";


export const initialState: CalendarState = {
  calendarDailyRate: {status: ELoadingStatus.idle, data: null},
  dailyRateCheckInOutPeriod: {status: ELoadingStatus.idle, data: null},
  calendarDirectRoom: {status: ELoadingStatus.idle, data: null},
  calendarRateWithCheckin: {status: ELoadingStatus.idle, data: null}
};

const calendarReducer = createReducer(
  initialState,
  on(loadCalendar, (state) => ({
    ...state,
    calendarDailyRate: {
      ...state.calendarDailyRate,
      status: ELoadingStatus.loading
    },
  })),
  on(loadedCalendarSuccess, (state, {result, cachingTime}) => {
    if (cachingTime) {
      return {
        ...state,
        calendarDailyRate: {
          ...state.calendarDailyRate,
          status: ELoadingStatus.loaded,
          data: [
            ...result,
            ...state.calendarDailyRate?.data?.filter(x => moment(cachingTime).format('MM, yyyy') === moment(x?.date).format('MM, yyyy')),
          ]?.sort((a, b) => {
            return moment(a?.date).isAfter(moment(b?.date), 'dates') ? 1 : -1;
          })
        }
      };
    } else {
      return {
        ...state,
        calendarDailyRate: {
          ...state.calendarDailyRate,
          status: ELoadingStatus.loaded,
          data: [...result]
        }
      };
    }
  }),
  on(loadedDailyRateSuccess, (state, {result}) => ({
    ...state,
    dailyRateCheckInOutPeriod: {
      ...state.dailyRateCheckInOutPeriod,
      error: null,
      status: ELoadingStatus.loaded,
      data: result,
    }
  })),
  on(loadCalendarDirectRoom, (state) => ({
    ...state,
    calendarDirectRoom: {
      ...state.calendarDirectRoom,
      status: ELoadingStatus.loading,
    }
  })),
  on(loadedCalendarDirectRoomSuccessfully, (state, {result, cachingTime}) => {
    if (cachingTime) {
      return {
        ...state,
        calendarDirectRoom: {
          ...state.calendarDirectRoom,
          status: ELoadingStatus.loaded,
          data: [
            ...result,
            ...state.calendarDirectRoom?.data?.filter(x => moment(cachingTime).format('MM, yyyy') === moment(x?.date).format('MM, yyyy')),
          ]?.sort((a, b) => {
            return moment(a?.date).isAfter(moment(b?.date), 'dates') ? 1 : -1;
          })
        }
      };
    } else {
      return {
        ...state,
        calendarDirectRoom: {
          ...state.calendarDirectRoom,
          status: ELoadingStatus.loaded,
          data: [...result]
        }
      };
    }
  }),
  on(loadCalendarWithCheckin, (state) => ({
    ...state,
    calendarRateWithCheckin: {
      ...state.calendarRateWithCheckin,
      status: ELoadingStatus.loading
    },
  })),
  on(loadedCalendarWithCheckinSuccess, (state, {result}) => {
    return {
      ...state,
      calendarRateWithCheckin: {
        ...state.calendarRateWithCheckin,
        error: null,
        status: ELoadingStatus.loaded,
        data: result,
      }
    }
  }),
  on(resetCalendarWithCheckin, (state) => {
    return {
      ...state,
      calendarRateWithCheckin: {
        ...state.calendarRateWithCheckin,
        error: null,
        status: ELoadingStatus.idle,
        data: null,
      }
    }
  }),
);

export function CalendarReducer(state: CalendarState, action: Action) {
  return calendarReducer(state, action);
}
