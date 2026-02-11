import { CppRestrictionDto } from '@src/modules/cpp/dtos/cpp-calculate-room-product-price.dto';
import {
  HotelRestrictionsDailyList,
  RatePlanRestrictionsDailyList,
  RoomProductRestrictionsDailyList
} from '@src/modules/restriction/restriction.dto';
import { addDays, eachDayOfInterval, format, getDay, isAfter, isBefore, subDays } from 'date-fns';
import { DATE_FORMAT } from '../constants/date.constant';
import { HotelRestrictionCodeEnum, Weekday } from '../enums/common';
import { Helper } from '../helper/utils';
import { parseDate } from './datetime.util';

const DayOfWeekMap: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};
export class CppRestrictionUtil {
  static toCppRatePlanOrRoomProductRestrictionList(
    ratePlanOrRoomProductId: string | undefined,
    ratePlanRestrictionMap: Map<
      string,
      RatePlanRestrictionsDailyList | RoomProductRestrictionsDailyList
    >
  ): CppRestrictionDto[] {
    if (!ratePlanOrRoomProductId) {
      return [];
    }

    const ratePlanRestrictionData = ratePlanRestrictionMap.get(ratePlanOrRoomProductId);
    if (!ratePlanRestrictionData || !ratePlanRestrictionData.dailyRestrictionList) {
      return [];
    }

    // Group restrictions by code and value
    const restrictionGroups = new Map<
      string,
      { code: HotelRestrictionCodeEnum; value: string; dates: string[]; weekdays?: Weekday[] }
    >();

    for (const dailyRestriction of ratePlanRestrictionData.dailyRestrictionList) {
      if (!dailyRestriction.restrictionList || dailyRestriction.restrictionList.length === 0) {
        continue;
      }

      for (const restriction of dailyRestriction.restrictionList) {
        if (restriction.code) {
          // Handle restrictions with null values (e.g., RSTR_CLOSE_TO_ARRIVAL)
          const valueStr = restriction.value != null ? String(restriction.value) : '';
          const key = `${restriction.code}_${valueStr}`;
          if (!restrictionGroups.has(key)) {
            restrictionGroups.set(key, {
              code: restriction.code,
              value: valueStr,
              dates: [],
              weekdays: restriction.weekdays
            });
          }
          restrictionGroups.get(key)!.dates.push(dailyRestriction.date);
        }
      }
    }

    // Convert groups to restriction list format
    const restrictionList: CppRestrictionDto[] = [];
    for (const group of restrictionGroups.values()) {
      if (group.dates.length === 0) {
        continue;
      }

      // Sort dates to find min and max
      const sortedDates = group.dates.sort();
      const minDate = sortedDates[0];
      const maxDate = sortedDates[sortedDates.length - 1];

      restrictionList.push({
        code: group.code,
        value: group.value,
        fromDate: minDate,
        toDate: maxDate,
        weekdays: group.weekdays
      });
    }

    return restrictionList;
  }

  static toCppHotelRestrictionList(
    hotelId: string | undefined,
    hotelRestrictionMap: Map<string, HotelRestrictionsDailyList>
  ): any[] {
    if (!hotelId) {
      return [];
    }
    const hotelRestrictionData = hotelRestrictionMap.get(hotelId);
    if (!hotelRestrictionData || !hotelRestrictionData.restrictionList) {
      return [];
    }

    // Group restrictions by code and value
    const restrictionGroups = new Map<
      string,
      { code: HotelRestrictionCodeEnum; value: string; dates: string[]; weekdays?: Weekday[] }
    >();
    for (const restriction of hotelRestrictionData.restrictionList) {
      if (restriction.code) {
        // Handle restrictions with null values (e.g., RSTR_CLOSE_TO_ARRIVAL)
        const valueStr = restriction.value != null ? String(restriction.value) : '';
        const key = `${restriction.code}_${valueStr}`;
        if (!restrictionGroups.has(key)) {
          restrictionGroups.set(key, {
            code: restriction.code,
            value: valueStr,
              dates: [],   
              weekdays: restriction.weekdays
          });
        }
        restrictionGroups.get(key)!.dates.push(hotelRestrictionData.date);
      }
    }

    // Convert groups to restriction list format
    const restrictionList: CppRestrictionDto[] = [];
    for (const group of restrictionGroups.values()) {
      if (group.dates.length === 0) {
        continue;
      }

      // Sort dates to find min and max
      const sortedDates = group.dates.sort();
      const minDate = sortedDates[0];
      const maxDate = sortedDates[sortedDates.length - 1];

      restrictionList.push({
        code: group.code,
        value: group.value,
        fromDate: minDate,
        toDate: maxDate,
        weekdays: group.weekdays
      });
    }

    return restrictionList;
  }

  static combineRestriction(
    source: CppRestrictionDto[],
    target: CppRestrictionDto[]
  ): CppRestrictionDto[] {
    const combinedRestriction: CppRestrictionDto[] = [...source];
    target.forEach((item) => {
      const existingItemIndex = combinedRestriction.findIndex(
        (sItem) => sItem.code.toString() === item.code.toString()
      );

      const existingItem = existingItemIndex !== -1 ? combinedRestriction[existingItemIndex] : null;

      if (!existingItem) {
        // Nếu restriction code chưa tồn tại, thêm mới
        combinedRestriction.push({
          code: item.code as any, // RestrictionCodeEnum
          value: item.value,
          fromDate: item.fromDate,
          toDate: item.toDate,
          weekdays: item.weekdays
        });
      } else {
        // Nếu restriction code đã tồn tại, so sánh và merge
        combinedRestriction[existingItemIndex] = this.mergeRestrictionValue(existingItem, item);
      }
    });

    return combinedRestriction;
  }

  static mergeRestrictionValue(
    sourceItem: CppRestrictionDto,
    targetItem: CppRestrictionDto
  ): CppRestrictionDto {
    const restrictionCode = targetItem.code;

    const mergeRestriction = structuredClone(sourceItem);

    switch (restrictionCode) {
      case HotelRestrictionCodeEnum.RSTR_LOS_MIN:
      case HotelRestrictionCodeEnum.RSTR_MIN_ADVANCE_BOOKING:
        // Lấy giá trị lớn hơn (hạn chế chặt chẽ hơn)
        if (CppRestrictionUtil.isNumeric(targetItem.value) && sourceItem) {
          const sourceVal = parseInt(sourceItem.value, 10);
          const targetVal = parseInt(targetItem.value, 10);
          if (targetVal > sourceVal) {
            mergeRestriction.value = targetItem.value;
          }
        }
        break;

      case HotelRestrictionCodeEnum.RSTR_LOS_MAX:
      case HotelRestrictionCodeEnum.RSTR_MAX_ADVANCE_BOOKING:
        // Lấy giá trị nhỏ hơn (hạn chế chặt chẽ hơn)
        if (CppRestrictionUtil.isNumeric(targetItem.value) && sourceItem) {
          const sourceVal = parseInt(sourceItem.value, 10);
          const targetVal = parseInt(targetItem.value, 10);
          if (targetVal < sourceVal) {
            mergeRestriction.value = targetItem.value;
          }
        }
        break;

      case HotelRestrictionCodeEnum.RSTR_MIN_LOS_THROUGH:
        // Lấy giá trị lớn hơn cho RSTR_MIN_LOS_THROUGH
        const sourceVal = sourceItem.value ? Number(sourceItem.value) : null;
        const targetVal = targetItem.value ? Number(targetItem.value) : null;
        if (sourceVal !== null && targetVal !== null && targetVal > sourceVal) {
          mergeRestriction.value = targetItem.value;
        }
        break;
    }
    return mergeRestriction;
  }

  static buildCppRestrictionList(input: {
    cppHotelRestrictionList: CppRestrictionDto[];
    cppRatePlanRestrictionList: CppRestrictionDto[];
    cppRoomProductRestrictionList: CppRestrictionDto[];
    fromDate: string;
    toDate: string;
  }): CppRestrictionDto[] {
    const { cppHotelRestrictionList, cppRatePlanRestrictionList, cppRoomProductRestrictionList, fromDate, toDate } =
      input;
    let result: CppRestrictionDto[] = [];

    const filteredHotelRestrictionList = this.filterHotelViolatedRestriction({ restrictionList: cppHotelRestrictionList, fromDate, toDate });
    const filteredRatePlanRestrictionList = this.filterRatePlanViolatedRestriction({ restrictionList: cppRatePlanRestrictionList, fromDate, toDate });
    const filteredRoomProductRestrictionList = this.filterRoomProductViolatedRestriction({ restrictionList: cppRoomProductRestrictionList, fromDate, toDate });

    if (filteredHotelRestrictionList.length > 0) {
      result = this.combineRestriction(result, filteredHotelRestrictionList);
    }

    if (filteredRatePlanRestrictionList.length > 0) {
      result = this.combineRestriction(result, filteredRatePlanRestrictionList);
    }

    if (filteredRoomProductRestrictionList.length > 0) {
      result = this.combineRestriction(result, filteredRoomProductRestrictionList);
    }

    return result;
  }


  static filterRatePlanViolatedRestriction(input: {
    restrictionList: CppRestrictionDto[];
    fromDate: string;
    toDate: string;
  }): CppRestrictionDto[] {
    const { restrictionList, fromDate, toDate } = input;

    return restrictionList.filter((restriction) =>
    {
      return  this.isViolatedCloseToArrivalHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedCloseToDepartureHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedMinLosHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedMaxLosHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedMaxAdvanceBookingRestriction({ restriction, fromDate })
      || this.isViolatedMinAdvanceBookingRestriction({ restriction, fromDate })
      || this.isViolatedMinLosThoughHotelRestriction({ restriction, fromDate, toDate })
    }
    );
  }

  static filterRoomProductViolatedRestriction(input: {
    restrictionList: CppRestrictionDto[];
    fromDate: string;
    toDate: string;
  }): CppRestrictionDto[] {
    const { restrictionList, fromDate, toDate } = input;

    return restrictionList.filter((restriction) =>
    {
      return this.isViolatedAvailablePeriodHotelRestriction({ restriction, fromDate, toDate }) 
      || this.isViolatedCloseToArrivalHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedCloseToDepartureHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedMinLosHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedMaxLosHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedMinLosThoughHotelRestriction({ restriction, fromDate, toDate })
    }
    );
  }

  static filterHotelViolatedRestriction(input: {
    restrictionList: CppRestrictionDto[];
    fromDate: string;
    toDate: string;
  }): CppRestrictionDto[] {
    const { restrictionList, fromDate, toDate } = input;

    return restrictionList.filter((restriction) =>
    {
      return this.isViolatedAvailablePeriodHotelRestriction({ restriction, fromDate, toDate }) 
      || this.isViolatedCloseToArrivalHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedCloseToDepartureHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedCloseToStayHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedMinLosHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedMaxLosHotelRestriction({ restriction, fromDate, toDate })
      || this.isViolatedMinLosThoughHotelRestriction({ restriction, fromDate, toDate })
    }
    );
  }

  static isViolatedAvailablePeriodHotelRestriction(input: {
    restriction: CppRestrictionDto;
    fromDate: string;
    toDate: string;
  }): boolean {
    const { restriction, fromDate, toDate } = input;

    if (restriction.code === HotelRestrictionCodeEnum.RSTR_AVAILABLE_PERIOD) {
      return isBefore(fromDate, restriction.fromDate) || isAfter(toDate, restriction.toDate);
    }
    return false;
  }

  static isViolatedCloseToArrivalHotelRestriction(input: {
    restriction: CppRestrictionDto;
    fromDate: string;
    toDate: string;
  }): boolean {
    const { restriction, fromDate, toDate } = input;

    if (restriction.code === HotelRestrictionCodeEnum.RSTR_CLOSE_TO_ARRIVAL) {
      return this.isDateInRange(fromDate, restriction.fromDate, restriction.toDate);
    }
    return false;
  }

  static isViolatedCloseToDepartureHotelRestriction(input: {
    restriction: CppRestrictionDto;
    fromDate: string;
    toDate: string;
  }): boolean {
    const { restriction, fromDate, toDate } = input;

    if (restriction.code === HotelRestrictionCodeEnum.RSTR_CLOSE_TO_DEPARTURE) {
      const departureDate = addDays(toDate, 1);
      return this.isDateInRange(
        format(departureDate, DATE_FORMAT),
        restriction.fromDate,
        restriction.toDate
      );
    }
    return false;
  }

  static isViolatedCloseToStayHotelRestriction(input: {
    restriction: CppRestrictionDto;
    fromDate: string;
    toDate: string;
  }): boolean {
    const { restriction, fromDate, toDate } = input;

    if (restriction.code === HotelRestrictionCodeEnum.RSTR_CLOSE_TO_STAY) {
      if (isBefore(restriction.toDate, toDate) || isAfter(restriction.fromDate, fromDate)) {
        return false;
      }

      const departure = format(addDays(toDate, 1), DATE_FORMAT);

      const ctsDateRange = eachDayOfInterval({
        start: parseDate(fromDate),
        end: parseDate(toDate)
      });
      const hasViolatedDate = ctsDateRange.some(
        (ctsDate) => !isBefore(ctsDate, fromDate) && isBefore(ctsDate, departure)
      );

      return hasViolatedDate;
    }
    return false;
  }

  static isViolatedMinLosHotelRestriction(input: {
    restriction: CppRestrictionDto;
    fromDate: string;
    toDate: string;
  }): boolean {
    const { restriction, fromDate, toDate } = input;

    if (restriction.code === HotelRestrictionCodeEnum.RSTR_LOS_MIN) {
      const los = Helper.generateDateRange(fromDate, toDate).length;

      let hotelMinLos = 0;

      if (!restriction.fromDate) {
        hotelMinLos = parseInt(restriction.value, 10);
      } else if (
        restriction.toDate &&
        this.isDateInRange(fromDate, restriction.fromDate, restriction.toDate)
      ) {
        hotelMinLos = parseInt(restriction.value, 10);
      }

      if (los < hotelMinLos) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  static isViolatedMaxLosHotelRestriction(input: {
    restriction: CppRestrictionDto;
    fromDate: string;
    toDate: string;
  }): boolean {
    const { restriction, fromDate, toDate } = input;

    if (restriction.code === HotelRestrictionCodeEnum.RSTR_LOS_MAX) {
      const los = Helper.generateDateRange(fromDate, toDate).length;

      let hotelMaxLos = 0;

      if (!restriction.fromDate) {
        hotelMaxLos = parseInt(restriction.value, 10);

        if (los > hotelMaxLos) {
          return true;
        } else {
          return false;
        }

      } else if (toDate && this.isDateInRange(fromDate, restriction.fromDate, restriction.toDate)) {
        hotelMaxLos = parseInt(restriction.value, 10);

        if (los > hotelMaxLos) {
          return true;
        } else {
          return false;
        }
      }


    }
    return false;
  }

  static isViolatedMinLosThoughHotelRestriction(input: {
    restriction: CppRestrictionDto;
    fromDate: string;
    toDate: string;
  }): boolean {
    const { restriction, fromDate, toDate } = input;

    if (restriction.code === HotelRestrictionCodeEnum.RSTR_MIN_LOS_THROUGH) {

      let minLos = -1;


      const value = restriction.value ? parseInt(restriction.value) : -1;


      if (!restriction.fromDate) {
        minLos = value;
      } else if (restriction.toDate && !isAfter(restriction.fromDate, toDate) && !isBefore(restriction.toDate, fromDate)) {
        minLos = value;
      }

      if (minLos > 0) {
        const los = Helper.generateDateRange(fromDate, toDate).length;
        for(const weekday of restriction.weekdays || []) {

          if(!weekday || typeof weekday !== 'string') {
            continue;
          }

          const restrictedDayIndex = DayOfWeekMap[weekday.toUpperCase()];

          const stayDates = eachDayOfInterval({ 
            start: parseDate(fromDate), 
            end: parseDate(toDate) 
          });
          const restrictedDate = stayDates.find(
            (date) => getDay(date) === restrictedDayIndex,
          );
  
          if (restrictedDate && los < minLos) {
            return true;
          }
          else {
            return false;
          }
        }
      }

    }
    return false;
  }


  static isViolatedMaxAdvanceBookingRestriction(input: {
    restriction: CppRestrictionDto;
    fromDate: string;
    bookedTime?: string;
  }): boolean {
    const { restriction, fromDate } = input;

    if (restriction.code === HotelRestrictionCodeEnum.RSTR_MAX_ADVANCE_BOOKING) {
      const bookedTime = !input.bookedTime ? format(new Date(), DATE_FORMAT) : input.bookedTime;

      if (
        restriction.fromDate &&
        restriction.toDate &&
        this.isDateInRange(fromDate, restriction.fromDate, restriction.toDate)
      ) {
        const maxAdvanceBookingDays = parseInt(restriction.value, 10);
        const earliestBookingDate = subDays(fromDate, maxAdvanceBookingDays);

        if (isBefore(bookedTime, earliestBookingDate)) {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  }

  static isViolatedMinAdvanceBookingRestriction(input: {
    restriction: CppRestrictionDto;
    fromDate: string;
    bookedTime?: string;
  }): boolean {
    const { restriction, fromDate } = input;

    if (restriction.code === HotelRestrictionCodeEnum.RSTR_MIN_ADVANCE_BOOKING) {
      const bookedTime = !input.bookedTime ? format(new Date(), DATE_FORMAT) : input.bookedTime;

      if (
        restriction.fromDate &&
        restriction.toDate &&
        this.isDateInRange(fromDate, restriction.fromDate, restriction.toDate)
      ) {
        const minAdvanceBookingDays = parseInt(restriction.value, 10);
        const latestBookingDate = subDays(fromDate, minAdvanceBookingDays);

        if (isAfter(bookedTime, latestBookingDate)) {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  }

  

  /**
   * Kiểm tra xem giá trị có đúng format RSTR_MIN_LOS_THROUGH không
   * Format: "[số-đêm]-[TÊN-NGÀY-TUẦN]" (ví dụ: "2-MONDAY")
   * @param value - Giá trị cần kiểm tra
   * @returns true nếu đúng format
   */
  static isMinLOSTValid(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    // Pattern: [0-9]+[-][A-Z]+
    const pattern = /^[0-9]+[-][A-Z]+$/;
    return pattern.test(value.trim());
  }

  /**
   * Lấy số đêm từ giá trị RSTR_MIN_LOS_THROUGH
   * Format: "[số-đêm]-[TÊN-NGÀY-TUẦN]" (ví dụ: "2-MONDAY" -> 2)
   * @param value - Giá trị RSTR_MIN_LOS_THROUGH
   * @returns Số đêm hoặc null nếu không hợp lệ
   */
  static getMinLOST(value: string): number | null {
    if (!this.isMinLOSTValid(value)) {
      return null;
    }

    const values = value.split('-');
    if (values.length === 2) {
      const nights = parseInt(values[0], 10);
      if (!isNaN(nights)) {
        return nights;
      }
    }

    return null;
  }

  /**
   * Kiểm tra xem giá trị có phải là số không
   * @param value - Giá trị cần kiểm tra
   * @returns true nếu là số
   */
  static isNumeric(value: string): boolean {
    return !isNaN(Number(value)) && !isNaN(parseFloat(value));
  }

  static isDateInRange(date: string, from: string, to: string): boolean {
    return !isBefore(date, from) && !isAfter(date, to);
  }
}
