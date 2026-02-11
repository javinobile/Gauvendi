import { RoomProductStatus, RoomProductType } from '@src/core/enums/common';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum RatePlanRfcAssignmentShowModeEnum {
  ALL = 'ALL',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED'
}

export class RoomProductAssignToRatePlanFilterDto {
  @IsNotEmpty()
  @IsString()
  hotelId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codeList?: string[];

  @IsOptional()
  @IsEnum(RoomProductType)
  type?: RoomProductType;

  @IsOptional()
  @IsArray()
  @IsEnum(RoomProductStatus, { each: true })
  statusList?: RoomProductStatus[];

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  ratePlanIdList?: string[];

  @IsOptional()
  @IsEnum(RatePlanRfcAssignmentShowModeEnum)
  showMode?: RatePlanRfcAssignmentShowModeEnum;

  @IsOptional()
  @IsString({ each: true })
  sort?: string[];
}

export class RoomProductAssignToRatePlanDto {
  id: string;
  code: string;
  name: string;
  type: RoomProductType;
  status: RoomProductStatus;

  roomProductRatePlans: {
    code: string;
    ratePlanId: string;
  }[];
}
