import { RoomUnitAvailabilityStatus } from "@src/core/enums/common.enum";
import { Transform, Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { ArrayProperty, OptionalArrayProperty } from "src/core/decorators/array-property.decorator";

export class UpsertRoomProductMappingPmsDto {
  @IsString()
  roomProductId: string;

  @IsString()
  hotelId: string;

  @IsString()
  @IsOptional()
  roomProductMappingPmsCode?: string;
}

export class SyncRoomProductAvailabilityPmsDto {
  @IsString()
  hotelId: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}

export class GetOverlappingRfcErfcForMrfcDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomProductId: string;

  @IsString()
  arrival: string;

  @IsString()
  departure: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @OptionalArrayProperty()
  retailFeatureIds?: string[];

  @OptionalArrayProperty()
  @IsOptional()
  statusList?: string[];
}

export class RoomProductUpdateAvailabilityDto extends GetOverlappingRfcErfcForMrfcDto {
  @ArrayProperty()
  @IsOptional()
  roomUnitIds: string[];
}

export class RoomProductAvailabilityDto {
  @IsString()
  hotelId: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestRoomsDto)
  requestRooms: RequestRoomsDto[];
}

export class RequestRoomsDto {
  @IsString()
  roomProductId: string;

  @IsString()
  arrival: string;

  @IsString()
  departure: string;
}

export class RoomProductReleaseAvailabilityDto {
  @IsString()
  hotelId: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestRoomsUpdateDto)
  requestRooms: RequestRoomsUpdateDto[];
}

export class UpdateRoomUnitAvailabilityStatusDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomProductId: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  // Only allow OUT_OF_ORDER or OUT_OF_INVENTORY
  @IsString()
  @IsIn([RoomUnitAvailabilityStatus.OUT_OF_ORDER, RoomUnitAvailabilityStatus.OUT_OF_INVENTORY])
  status: RoomUnitAvailabilityStatus;
}

export class ManualUpsertDailyAvailabilityDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomProductId: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  available?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sellLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  adjustment?: number;
}

export class ProcessRoomUnitAvailabilityUpdateDto {
  @IsString()
  hotelId: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestRoomsUpdateDto)
  requestRooms: RequestRoomsUpdateDto[];
}

export class RequestRoomsUpdateDto {
  @IsString()
  roomProductId: string;

  @IsString()
  arrival: string;

  @IsString()
  departure: string;

  @ArrayProperty()
  @IsOptional()
  roomUnitIds?: string[]; // may be empty in oversell case
}

export class GenerateRoomProductAvailabilityDto {
  @IsString()
  hotelId: string;
}

export class UpsertRoomProductAvailabilityDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomProductId: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsInt()
  adjustment: number;
}

export class CalendarRoomProductQueryDto {
  @ArrayProperty()
  @IsOptional()
  childAgeList: number[];

  @IsString()
  fromDate: string;

  @ArrayProperty()
  types: string[];

  @IsString()
  hotelId: string;

  @IsString()
  toDate: string;

  @IsNumber()
  totalAdult: number;

  @IsNumber()
  @IsOptional()
  totalPet?: number;
}

export class CalendarRoomProductAvailabilityQueryDto {
  @IsString()
  fromDate: string;

  @ArrayProperty()
  roomProductCodeList: string[];

  @IsString()
  hotelId: string;

  @IsString()
  toDate: string;
}

export class GetRoomProductMappingPmsDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomProductId: string;

  @IsArray()
  roomUnitIds: string[];
}

export class SetOversellAdjustmentDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomProductId: string;

  @IsString()
  date: string;

  @IsInt()
  @Min(0)
  adjustment: number;
}

export class GetRelatedMrfcDto {
  @IsString()
  hotelId: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  roomProductIds: string[];
}
