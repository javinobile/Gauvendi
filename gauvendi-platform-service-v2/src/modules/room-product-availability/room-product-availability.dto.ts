import { RoomProduct } from 'src/core/entities/room-product.entity';
import { RoomProductStatus, RoomUnitAvailabilityStatus } from 'src/core/enums/common';

export class UpsertRoomProductMappingPmsDto {
  roomProductId: string;

  hotelId: string;

  roomProductMappingPmsCode?: string;
}

export class SyncRoomProductAvailabilityPmsDto {
  hotelId: string;

  startDate?: string;

  endDate?: string;
}

export class GetOverlappingRfcErfcForMrfcDto {
  hotelId: string;

  roomProductId: string;

  arrival: string;

  departure: string;
  name?: string;
  retailFeatureIds?: string[];
  statusList?: RoomProductStatus[];
}

export class RoomProductUpdateAvailabilityDto extends GetOverlappingRfcErfcForMrfcDto {
  roomUnitIds: string[];
}

export class RoomProductAvailabilityDto {
  hotelId: string;

  requestRooms: RequestRoomsDto[];
}

export class RequestRoomsDto {
  roomProductId: string;

  roomUnitId?: string;

  arrival: string;

  departure: string;
}

export class RoomProductReleaseAvailabilityDto {
  hotelId: string;

  requestRooms: RequestRoomsUpdateDto[];
}

export class UpdateRoomUnitAvailabilityStatusDto {
  hotelId: string;

  roomProductId: string;

  startDate: string;

  endDate: string;

  // Only allow OUT_OF_ORDER or OUT_OF_INVENTORY
  status: RoomUnitAvailabilityStatus;
}

export class ManualUpsertDailyAvailabilityDto {
  hotelId: string;

  roomProductId: string;

  startDate: string;

  endDate: string;

  available?: number;

  sellLimit?: number;

  adjustment?: number;
}

export class ProcessRoomUnitAvailabilityUpdateDto {
  hotelId: string;

  requestRooms: RequestRoomsUpdateDto[];
}

export class RequestRoomsUpdateDto {
  roomProductId: string;

  arrival: string;

  departure: string;

  roomUnitIds?: string[]; // may be empty in oversell case
}

export class GenerateRoomProductAvailabilityDto {
  hotelId: string;

  roomProductIds?: string[];

  fromDate?: string;

  toDate?: string;
}

export class UpsertRoomProductAvailabilityDto {
  hotelId: string;

  roomProductId: string;

  startDate: string;

  endDate: string;

  adjustment: number;
}

export class CalendarRoomProductQueryDto {
  childAgeList: number[];

  fromDate: string;

  types: string[];

  hotelId: string;

  toDate: string;

  totalAdult: number;

  totalPet?: number;
}

export class CalendarRoomProductAvailabilityQueryDto {
  fromDate: string;

  roomProductCodeList: string[];

  hotelId: string;

  toDate: string;
}

export interface CalendarAvailabilityResult {
  hotelId: string;
  fromDate: string;
  toDate: string;
  totalAdult: number;
  totalPet?: number;
  childAgeList: number[];
  types: string[];
  availabilityPerDate: Map<string, number>; // date -> count of available products
  roomProductsWithCapacity: RoomProduct[];
}

export class GetRoomProductMappingPmsDto {
  hotelId: string;

  roomProductId: string;

  roomUnitIds: string[];
}

export class SetOversellAdjustmentDto {
  hotelId: string;

  roomProductId: string;

  date: string;

  adjustment: number;
}

export class GetRelatedMrfcDto {
  hotelId: string;

  roomProductIds: string[];
}
