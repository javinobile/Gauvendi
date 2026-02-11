import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { RoomProductStatus, RoomProductType } from "@src/core/enums/common.enum";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export enum RatePlanRfcAssignmentShowModeEnum {
  ALL = "ALL",
  ASSIGNED = "ASSIGNED",
  UNASSIGNED = "UNASSIGNED",
}

export class RoomProductAssignToRatePlanFilterDto {
  @IsNotEmpty()
  @IsString()
  hotelId: string;

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  codeList?: string[];

  @IsOptional()
  @IsEnum(RoomProductType)
  type?: RoomProductType;

  @IsOptional()
  @IsEnum(RoomProductStatus, { each: true })
  @OptionalArrayProperty()
  statusList?: RoomProductStatus[];

  @IsOptional()
  @IsUUID(4, { each: true })
  @OptionalArrayProperty()
  ratePlanIdList?: string[];

  @IsOptional()
  @IsEnum(RatePlanRfcAssignmentShowModeEnum)
  showMode?: RatePlanRfcAssignmentShowModeEnum;

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  sort?: string[];
}
