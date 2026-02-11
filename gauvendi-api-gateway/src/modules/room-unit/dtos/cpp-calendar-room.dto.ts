import { RoomUnitStatus } from "@src/core/enums/common.enum";
import { IsDateString, IsNotEmpty, IsString } from "class-validator";



export class CppCalendarRoomFilterDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;
  @IsDateString()
  @IsNotEmpty()
  fromDate: string;
  @IsDateString()
  @IsNotEmpty()
  toDate: string;
}

export interface CppCalendarRoomDto {
  id: string;
  roomNumber: string;
  roomStatus: RoomUnitStatus;
  outOfOrderDates: string[] | null;
}