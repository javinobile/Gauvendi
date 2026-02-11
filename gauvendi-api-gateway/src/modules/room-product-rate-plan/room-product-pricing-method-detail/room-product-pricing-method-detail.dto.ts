import { ConnectorTypeEnum } from "@src/core/enums/common.enum";
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { RoomProductPricingMethodAdjustmentUnitEnum, RoomProductPricingMethodEnum } from "src/core/enums/common.enum";
export class UpdateRoomProductPricingMethodDetailDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  ratePlanId: string;

  @IsString()
  @IsNotEmpty()
  roomProductId: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsEnum(RoomProductPricingMethodEnum)
  @IsNotEmpty()
  type: RoomProductPricingMethodEnum;

  @IsString()
  @IsOptional()
  value?: string;

  @IsEnum(RoomProductPricingMethodAdjustmentUnitEnum)
  @IsOptional()
  unit?: RoomProductPricingMethodAdjustmentUnitEnum;

  @IsBoolean()
  @IsOptional()
  isPush?: boolean;

  @IsString()
  @IsOptional()
  targetRatePlanId?: string;

  @IsString()
  @IsOptional()
  targetRoomProductId?: string;

  @IsString()
  @IsOptional()
  pmsRatePlanCode?: string;

  @IsString()
  @IsOptional()
  mappingRoomProductId?: string;

  @IsEnum(ConnectorTypeEnum)
  @IsOptional()
  connectorType?: ConnectorTypeEnum;
}

export class PmsEventPricingUpdateDto {
  @IsString()
  @IsNotEmpty()
  connectorId: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  // for Mews PMS
  @IsString()
  @IsOptional()
  RateId?: string; // mean rate plan pms code

  @IsString()
  @IsOptional()
  ResourceCategoryId?: string; // mean room product pms code

  @IsString()
  @IsOptional()
  StartUtc?: string; // mean start date

  @IsString()
  @IsOptional()
  EndUtc?: string; // mean end date
}


export class BulkTriggerAllPricingDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;
}