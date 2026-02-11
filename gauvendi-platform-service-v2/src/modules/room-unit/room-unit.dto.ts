import { DayOfWeek, RoomUnitAvailabilityStatus } from 'src/core/enums/common';

export class GetPmsRoomUnitsMaintenanceDto {
  hotelId: string;

  startDate: string;

  endDate: string;
}

export class GetRoomUnitDto {
  hotelId: string;

  relations?: string[];

  ids?: string[];

  mappingPmsCodes?: string[];

  spaceTypeIds?: string[];
  featureIds?: string[];

  space?: number;

  building?: string;

  floor?: string;

  roomProductId?: string;

  hasCheckQuantity?: boolean;
}
export class GetRoomUnitAvailabilityDto extends GetRoomUnitDto {
  roomProductIds?: string[];

  startDate: string;

  endDate: string;

  searchTerm?: string;

  hotelRetailFeatureIds?: string[];
}

export class RoomUnitRetailFeatureDto {
  retailFeatureId: string;

  quantity?: number;
}

export class UpdateRoomUnitFeaturesDto {
  hotelId: string;

  roomUnitId: string;

  retailFeatures?: RoomUnitRetailFeatureDto[];

  standardFeatureIds?: string[];

  keepOldRetailFeatures?: boolean;
}

export class BulkDeleteRoomUnitDto {
  hotelId: string;

  idList: string[];
}

export class BulkUpdateRoomUnitDto {
  hotelId: string;

  roomUnitIds: string[];

  roomFloor?: string;

  roomNumber?: string;

  building?: string;

  connectingRoomId?: string;

  space?: number;

  retailFeatures?: RoomUnitRetailFeatureDto[];

  standardFeatureIds?: string[];

  keepOldRetailFeatures?: boolean;

  pmsMappingCode?: string;
}

export class CreateRoomUnitDto {
  hotelId: string;

  roomNumber: string;

  roomFloor?: string;

  space?: number;

  building?: string;

  connectingRoomId?: string;

  retailFeatures?: RoomUnitRetailFeatureDto[];
}

export class UpdateRoomUnitRetailFeaturesDto {
  hotelId: string;

  roomUnitId: string;

  retailFeatures: RoomUnitRetailFeatureDto[];

  keepOldRetailFeatures?: boolean;
}

export class RoomFeatureItemDto {
  roomId: string;

  retailFeatureId: string;

  quantity: number;
}

export class SetRoomFeaturesDto {
  hotelId: string;

  roomFeatureList: RoomFeatureItemDto[];
}
export class RoomUnitMaintenanceDto {
  roomUnitIds: string[];

  hotelId: string;

  startDate: string;

  endDate: string;

  status: RoomUnitAvailabilityStatus;
  daysOfWeek: DayOfWeek[];
}
export interface IRoomUnitMaintenance {
  roomUnitMappingPmsCode: string;
  from: string;
  to: string;
  type: RoomUnitAvailabilityStatus;
  maintenancePmsCode: string;
}

export class DeleteMaintenancesDto {
  hotelId: string;
  maintenanceIds: string[];
}

export class RefreshRoomStatus {
  from: string;
  to: string;
  hotelId: string;
}
