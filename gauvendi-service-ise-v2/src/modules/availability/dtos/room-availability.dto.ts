import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class RoomAvailabilityDto {
  roomIds: string[];

  hotelId: string;

  @IsString()
  from: string;

  @IsString()
  to: string;
}

export class RequestRoom {
  @IsString()
  roomProductId: string;

  @IsString()
  arrival: string; // format YYYY-MM-DD

  @IsString()
  departure: string; // format YYYY-MM-DD

  roomUnitIds?: string[]; // may be empty in oversell case
}
export class RoomProductCheckAvailabilityDto {
  @IsString()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestRoom)
  requestRooms: RequestRoom[];
}

export interface RoomProduct {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  rfcAllocationSetting: string;

  // roomProductDailyAvailabilities: RoomProductAvailability[];
  roomProductAssignedUnits: RoomProductAssignedUnit[];
}

export interface RoomProductAvailability {
  date: string;
  available: number;
  sellLimit: number;
  adjustment: number;
  sold: number;
}

export interface RoomProductAssignedUnit {
  roomUnitId: string;
  totalAmount: number;
  roomUnit: {
    id: string;
    roomNumber: string;
    roomType: string;
    roomUnitAvailabilities: {
      date: string;
      status: string;
    }[];
  };
}

export class ProcessRoomUnitAvailabilityUpdateDto {
  hotelId: string;
  requestRooms: RequestRoom[];
}

export class RoomProductReleaseAvailabilityDto extends ProcessRoomUnitAvailabilityUpdateDto {}

export class GetRoomProductMappingPmsDto {
  hotelId: string;

  roomProductId: string;

  roomUnitIds: string[];
}

export class GetRelatedMrfcDto {
  hotelId: string;
  roomProductIds: string[];
}
export class GetRelatedMrfcResponseDto {
  relatedMrfcId: string;
  relatedMrfcCode: string;
  relatedMrfcName: string;
  roomProductId: string;
}
