import {CalendarDailyRate} from "@app/core/graphql/generated/graphql";
import {LoadingStatus} from "@models/loading-status.model";

export const CALENDAR_FEATURE_KEY = 'CALENDAR-STATE';

export interface CalendarState {
  calendarDailyRate: {
    status: LoadingStatus;
    data: CalendarDailyRate[];
    error?: string;
  };

  dailyRateCheckInOutPeriod: {
    status: LoadingStatus;
    data: CalendarDailyRate[];
    error?: string;
  };

  calendarDirectRoom: {
    status: LoadingStatus;
    data: CalendarDailyRate[];
    error?: string;
  };

  calendarRateWithCheckin: {
    status: LoadingStatus;
    data: CalendarDailyRate[];
    error?: string;
  };
}
