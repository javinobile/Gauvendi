import { RoomUnitStatus } from "@src/core/enums/common";



export interface CppCalendarRoomFilterDto {
  hotelId: string;
  fromDate: string;
  toDate: string;
}

export interface CppCalendarRoomDto {
  id: string;
  roomNumber: string;
  roomStatus: RoomUnitStatus;
  outOfOrderDates: string[] | null;
}