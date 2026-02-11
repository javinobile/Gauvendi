import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { ArrayProperty, OptionalArrayProperty } from "src/core/decorators/array-property.decorator";
import { DayOfWeek, RoomUnitAvailabilityStatus } from "src/core/enums/common.enum";

export class GetPmsRoomUnitsMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}

export class GetRoomUnitDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @OptionalArrayProperty()
  relations?: string[];

  @OptionalArrayProperty()
  ids?: string[];

  @OptionalArrayProperty()
  spaceTypeIds?: string[];

  @OptionalArrayProperty()
  featureIds?: string[];

  @IsOptional()
  @IsNumber()
  space?: number;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  roomProductId?: string;

  @IsBoolean()
  @IsOptional()
  hasCheckQuantity?: boolean;
}
export class GetRoomUnitAvailabilityDto extends GetRoomUnitDto {
  @ArrayProperty()
  @IsOptional()
  roomProductIds?: string[];

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ArrayProperty()
  @IsOptional()
  hotelRetailFeatureIds?: string[];
}

export class RoomUnitRetailFeatureDto {
  @IsString()
  @IsNotEmpty()
  retailFeatureId: string;

  @IsOptional()
  quantity?: number;
}

export class UpdateRoomUnitFeaturesDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  roomUnitId: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoomUnitRetailFeatureDto)
  retailFeatures?: RoomUnitRetailFeatureDto[];

  @IsArray()
  @IsOptional()
  @Type(() => String)
  standardFeatureIds?: string[];

  @IsBoolean()
  @IsOptional()
  keepOldRetailFeatures?: boolean;
}

export class BulkUpdateRoomUnitDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @IsNotEmpty()
  @Type(() => String)
  roomUnitIds: string[];

  @IsString()
  @IsOptional()
  roomFloor?: string;

  @IsString()
  @IsOptional()
  roomNumber?: string;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  @IsOptional()
  connectingRoomId?: string;

  @IsOptional()
  space?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoomUnitRetailFeatureDto)
  retailFeatures?: RoomUnitRetailFeatureDto[];

  @IsArray()
  @IsOptional()
  @Type(() => String)
  standardFeatureIds?: string[];

  @IsBoolean()
  @IsOptional()
  keepOldRetailFeatures?: boolean;

  @IsString()
  @IsOptional()
  pmsMappingCode?: string;
}

export class CreateRoomUnitDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsString()
  @IsOptional()
  roomFloor?: string;

  @IsNumber()
  @IsOptional()
  space?: number;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  @IsOptional()
  connectingRoomId?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoomUnitRetailFeatureDto)
  retailFeatures?: RoomUnitRetailFeatureDto[];
}

export class UpdateRoomUnitRetailFeaturesDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RoomUnitRetailFeatureDto)
  retailFeatures: RoomUnitRetailFeatureDto[];

  @IsBoolean()
  @IsOptional()
  keepOldRetailFeatures?: boolean;
}

export class RoomFeatureItemDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  retailFeatureId: string;

  @IsNumber()
  quantity: number;
}

export class SetRoomFeaturesDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RoomFeatureItemDto)
  roomFeatureList: RoomFeatureItemDto[];
}
export class RoomUnitMaintenanceDto {
  @IsArray()
  roomUnitIds: string[];

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(RoomUnitAvailabilityStatus)
  status: RoomUnitAvailabilityStatus;

  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek: DayOfWeek[];
}

export class BulkDeleteRoomUnitDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  @IsNotEmpty()
  idList: string[];
}

export class RoomUnitInventoryDto {
  @IsString()
  @IsUUID()
  hotelId: string;
}

export class DeleteMaintenancesDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  @IsNotEmpty()
  maintenanceIds: string[];
}

export class RefreshRoomStatus {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class RegenerateFeatureStringDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsBoolean()
  @IsOptional()
  isGenerateRoomUnit?: boolean;

  @IsBoolean()
  @IsOptional()
  isGenerateRoomProductRFC?: boolean;

  @IsBoolean()
  @IsOptional()
  isGenerateRoomProductMRFC?: boolean;
}
