import { IsString, IsDateString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class DailyOccupancyRateFilter {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsString()
  hotelId?: string;

  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @IsDateString()
  @IsNotEmpty()
  toDate: string;

  @IsBoolean()
  @IsOptional()
  onlyOccRate?: boolean;
}

export class DailyOccupancyRateRoomSold {
  value: number;
  channel: string;
}

export class DailyOccupancyRateAvailableToSell {
  value: number;
  channel: string;
}

export class DailyOccupancyRate {
  date: string;
  occupancyRate: number;
  totalRoomInventory: number;
  totalOutOfInventory: number;
  totalPropertyRooms: number;
  totalOutOfOrder: number;
  totalOutOfService: number;
  roomSoldList: DailyOccupancyRateRoomSold[];
  totalAvailablePropertyRooms: number;
  totalAvailabilityAdjustment: number;
  availableToSellList: DailyOccupancyRateAvailableToSell[];
  totalRoomsAssigned: number;
  totalRoomsUnassigned: number;
  totalRoomsSoldAssigned: number;
  totalRoomsSoldUnassigned: number;
  totalRoomSold: number; // Missing field from Java DTO

  // block daily data
  totalTentativelyBlock?: number;
  totalDefinitelyBlock?: number;
  totalPickedUnits?: number;
}
