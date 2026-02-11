import { format, format as formatDate, parse } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { ar, de, enUS, es, fr, it, nl } from 'date-fns/locale';
import { DATE_FORMAT } from '../constants/date.constant';
import { DayOfWeek, LanguageCodeEnum, SeasonOfYear } from '../enums/common';

export const formatDateTimeWithTimeZone = ({
  date,
  timeZone,
  format
}: {
  date: any;
  timeZone: string;
  format?: string;
}) => formatInTimeZone(new Date(date), timeZone, format ?? 'yyyy-MM-dd');

export const formatDateString = (date: Date): string => {
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

/**
 * Safely parse user input dates to UTC, considering timezone context
 * Best practice: Always convert user input to UTC for backend processing
 *
 * @param dateInput - Date string from user (e.g., "2025-11-07T00:00:00.000Z" or "2025-11-07")
 * @param userTimezone - User's timezone (e.g., "America/New_York")
 * @param hotelTimezone - Hotel's timezone for fallback
 * @returns UTC Date object for backend processing
 */
export const parseUserDateToUTC = (
  dateInput: string,
  userTimezone?: string,
  hotelTimezone?: string
): Date => {
  if (!dateInput) {
    throw new Error('Date input is required');
  }

  // If the date string already has timezone info (ends with Z or has offset), use it directly
  if (dateInput.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateInput)) {
    return new Date(dateInput);
  }

  // For date-only strings like "2025-11-07", interpret in user's timezone
  const targetTimezone = userTimezone || hotelTimezone || 'UTC';

  // If it's a date-only string (YYYY-MM-DD), assume start of day in target timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const dateWithTime = `${dateInput}T00:00:00`;
    return fromZonedTime(dateWithTime, targetTimezone);
  }

  // For datetime strings without timezone, interpret in target timezone
  return fromZonedTime(dateInput, targetTimezone);
};

/**
 * Convert arrival/departure dates from user input to UTC for backend processing
 * This is the main function that should be used for API date inputs
 *
 * @param arrival - Arrival date string from user
 * @param departure - Departure date string from user
 * @param userTimezone - User's timezone (optional)
 * @param hotelTimezone - Hotel's timezone (fallback)
 * @returns Object with UTC dates formatted for backend use
 */
export const parseStayDatesToUTC = (
  arrival: string,
  departure: string,
  userTimezone?: string,
  hotelTimezone?: string
): {
  arrivalUTC: Date;
  departureUTC: Date;
  fromDateFormatted: string;
  toDateFormatted: string;
} => {
  const arrivalUTC = parseUserDateToUTC(arrival, userTimezone, hotelTimezone);
  const departureUTC = parseUserDateToUTC(departure, userTimezone, hotelTimezone);

  // Validate dates
  if (arrivalUTC >= departureUTC) {
    throw new Error('Departure date must be after arrival date');
  }

  const today: string = format(toZonedTime(new Date(), 'UTC'), DATE_FORMAT);
  const arrivalString: string = format(toZonedTime(new Date(arrival), 'UTC'), DATE_FORMAT);
  if (arrivalString < today) {
    throw new Error('Arrival date must be today or in the future');
  }

  // Format for backend use (stay dates exclude departure day)
  const fromDateFormatted = formatDate(arrivalUTC, DATE_FORMAT);
  const toDateFormatted = formatDate(
    new Date(departureUTC.getTime() - 24 * 60 * 60 * 1000), // Subtract 1 day
    DATE_FORMAT
  );

  return {
    arrivalUTC,
    departureUTC,
    fromDateFormatted,
    toDateFormatted
  };
};

export const setTimeFromTimeSlice = (date: string, time: string) => {
  if (!time) return date;

  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return date;
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');

  return `${date} ${hoursStr}:${minutesStr}:00`;
};

/**
 * Get the date-fns locale object based on language code
 */
const getDateFnsLocale = (languageCode: LanguageCodeEnum) => {
  switch (languageCode) {
    case LanguageCodeEnum.FR:
      return fr;
    case LanguageCodeEnum.DE:
      return de;
    case LanguageCodeEnum.IT:
      return it;
    case LanguageCodeEnum.ES:
      return es;
    case LanguageCodeEnum.NL:
      return nl;
    case LanguageCodeEnum.AR:
      return ar;
    case LanguageCodeEnum.EN:
    default:
      return enUS;
  }
};

/**
 * Format date to localized string like "Thu, 11 Sep 2025"
 * @param date - Date string or Date object
 * @param languageCode - Language code for localization
 * @returns Formatted date string like "Thu, 11 Sep 2025"
 */
export const formatDateWithLanguage = (
  date: string | Date,
  languageCode: LanguageCodeEnum = LanguageCodeEnum.EN
): string => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const locale = getDateFnsLocale(languageCode);

    // Format as "EEE, d MMM yyyy" which produces "Thu, 11 Sep 2025"
    return formatDate(dateObj, 'EEE, d MMM yyyy', { locale });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const parseLanguageCode = (language?: string): LanguageCodeEnum | undefined => {
  if (!language) return LanguageCodeEnum.EN;

  try {
    return (
      LanguageCodeEnum[language.toUpperCase() as keyof typeof LanguageCodeEnum] ||
      LanguageCodeEnum.EN
    );
  } catch {
    return LanguageCodeEnum.EN;
  }
};

export const getAllowedDateByDayOfWeek = (
  fromDateStr: string,
  toDateStr: string,
  dayList: DayOfWeek[]
): string[] => {
  // Preserve the exact Java Stream logic for generating date-based adjustments

  if (!dayList || dayList.length === 0) {
    return [];
  }

  const fromDate = new Date(fromDateStr);
  const toDate = new Date(toDateStr);

  // Convert DayOfWeek enum to JavaScript day numbers for filtering
  const allowedDays = dayList.map((day) => dayOfWeekToJSDay(day));

  // Iterate through date range (matching Java Stream.iterate logic)
  const dates: Date[] = [];
  for (
    let currentDate = new Date(fromDate);
    currentDate <= toDate;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const day = currentDate.getDay();

    // Check if current day is in the allowed days list (matching Java filter logic)
    if (allowedDays.includes(day)) {
      dates.push(new Date(currentDate));
    }
  }

  return dates.map((date) => formatDate(date, DATE_FORMAT));
};

export const getSeasonOfDate = (date: Date): SeasonOfYear => {
  const month = date.getMonth() + 1; // 1 - 12

  if (month >= 1 && month <= 3) {
    return SeasonOfYear.Spring;
  }
  if (month >= 4 && month <= 6) {
    return SeasonOfYear.Summer;
  }
  if (month >= 7 && month <= 9) {
    return SeasonOfYear.Fall;
  }
  return SeasonOfYear.Winter; // 10–12
};

export const getAllowedDateBySessionOfYear = (
  fromDateStr: string,
  toDateStr: string,
  seasonList: SeasonOfYear[]
): string[] => {
  if (!seasonList || seasonList.length === 0) return [];

  const fromDate = new Date(fromDateStr);
  const toDate = new Date(toDateStr);

  const result: string[] = [];

  for (
    let current = new Date(fromDate);
    current <= toDate;
    current.setDate(current.getDate() + 1)
  ) {
    const season = getSeasonOfDate(current);

    if (seasonList.includes(season)) {
      result.push(formatDate(current, DATE_FORMAT));
    }
  }

  return result;
};

/**
 * Combine multiple date ranges to find the largest date range
 * Returns a range that covers all input ranges (min fromDate and max toDate)
 * @param dateRanges Array of date ranges to combine
 * @returns Combined date range with min fromDate and max toDate, or null if input is empty
 * @example
 * combineMaxDateRanges([
 *   { fromDate: '2025-01-01', toDate: '2025-01-10' },
 *   { fromDate: '2025-01-05', toDate: '2025-01-15' },
 *   { fromDate: '2025-01-20', toDate: '2025-01-25' }
 * ])
 * // Returns: { fromDate: '2025-01-01', toDate: '2025-01-25' }
 */
export const combineMaxDateRanges = (
  dateRanges: Array<{ fromDate: string; toDate: string }>
): { fromDate: string; toDate: string } | null => {
  if (!dateRanges || dateRanges.length === 0) {
    return null;
  }

  // Filter out invalid ranges
  const validRanges = dateRanges.filter((range) => range?.fromDate && range?.toDate);

  if (validRanges.length === 0) {
    return null;
  }

  // Find min fromDate and max toDate across all ranges
  let minFromDate = new Date(validRanges[0].fromDate);
  let maxToDate = new Date(validRanges[0].toDate);

  for (let i = 1; i < validRanges.length; i++) {
    const fromDate = new Date(validRanges[i].fromDate);
    const toDate = new Date(validRanges[i].toDate);

    // Validate date range
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      continue;
    }

    if (fromDate < minFromDate) {
      minFromDate = fromDate;
    }

    if (toDate > maxToDate) {
      maxToDate = toDate;
    }
  }

  // Validate that fromDate <= toDate
  if (minFromDate > maxToDate) {
    return null;
  }

  return {
    fromDate: formatDate(minFromDate, DATE_FORMAT),
    toDate: formatDate(maxToDate, DATE_FORMAT)
  };
};

/**
 * Check if a date range is completely within another date range
 * @param innerRange The date range to check (task date range)
 * @param outerRange The outer date range (result date range)
 * @returns true if innerRange is completely within outerRange
 */
export const isDateRangeWithin = (
  innerRange: { fromDate: string; toDate: string },
  outerRange: { fromDate: string; toDate: string }
): boolean => {
  if (!innerRange.fromDate || !innerRange.toDate || !outerRange.fromDate || !outerRange.toDate) {
    return false;
  }

  const innerFrom = new Date(innerRange.fromDate);
  const innerTo = new Date(innerRange.toDate);
  const outerFrom = new Date(outerRange.fromDate);
  const outerTo = new Date(outerRange.toDate);

  // Check if inner range is completely within outer range
  return innerFrom >= outerFrom && innerTo <= outerTo;
};

export const dayOfWeekToJSDay = (dayOfWeek: DayOfWeek): Number => {
  // Convert DayOfWeek enum to JavaScript day numbers (Sunday = 0, Saturday = 6)
  const mapping = {
    [DayOfWeek.SUNDAY]: 0,
    [DayOfWeek.MONDAY]: 1,
    [DayOfWeek.TUESDAY]: 2,
    [DayOfWeek.WEDNESDAY]: 3,
    [DayOfWeek.THURSDAY]: 4,
    [DayOfWeek.FRIDAY]: 5,
    [DayOfWeek.SATURDAY]: 6
  };
  return mapping[dayOfWeek];
};

export const parseDate = (dateStr: string, format: string = DATE_FORMAT): Date => {
  return parse(dateStr, format, new Date());
};
