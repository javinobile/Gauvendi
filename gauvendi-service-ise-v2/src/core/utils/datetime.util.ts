import { parse } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { DATE_FORMAT } from '../constants/date.constant';

export const formatDateTimeWithTimeZone = ({
  date,
  timeZone,
  format
}: {
  date: any;
  timeZone: string;
  format?: string;
}) => formatInTimeZone(new Date(date), timeZone, format ?? 'yyyy-MM-dd');

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getNights = (arrival: Date | null, departure: Date | null) => {
  if (!arrival || !departure) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((departure.getTime() - arrival.getTime()) / msPerDay);
};

export const getRangeDates = (arrival: any, departure: any): string[] => {
  const start = arrival instanceof Date ? arrival : new Date(arrival);
  const end = departure instanceof Date ? departure : new Date(departure);
  const dates: string[] = [];

  for (let d = start; d < end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]); // format YYYY-MM-DD
  }

  return dates;
};

export const convertToUtcTimeUnits = (timezone: string, date: Date) => {
  const newDate = fromZonedTime(date, timezone);
  const dateUtc = newDate.toISOString();
  return dateUtc;
};

export const convertToUtcDate = (timezone: string, date: string) => {
  const newDate = fromZonedTime(date, timezone);
  return newDate;
};

export const setTimeFromTimeSlice = (date: string, time: string) => {
  if (!time) return date;

  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return date;
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');

  return `${date} ${hoursStr}:${minutesStr}:00`;
};

export const convertToHotelTimezone = (date: any, hotelTimezone: string): any => {
  // Convert UTC -> Hotel timezone
  const zonedDate = toZonedTime(date, hotelTimezone);
  return zonedDate?.toISOString();

  // // Format thành ISO string với offset
  // return formatInTimeZone(date, hotelTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

/**
 * Convert date to hotel timezone and format as YYYY-MM-DD for Apaleo API
 */
export const convertToHotelTimezoneDate = (date: any, hotelTimezone: string): string => {
  // Convert UTC -> Hotel timezone and format as YYYY-MM-DD
  return formatInTimeZone(date, hotelTimezone, 'yyyy-MM-dd');
};


export const parseDate = (dateStr: string, format: string = DATE_FORMAT): Date => {
  return parse(dateStr, format, new Date());
};