import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class RoomDailyAvailabilityFilter {
  @IsNotEmpty()
  @IsUUID()
  rfcId: string;

  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;
}

export class RoomDailyAvailabilityDto {
  date: string;
  availableRooms: number;
  roomSold: number | null;
  occupancy: number | null;
}
