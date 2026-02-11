import { IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { ArrayProperty } from '@src/core/decorators/array-property.decorator';
import {
  ConfiguratorModeEnum,
  ConfiguratorTypeEnum,
  ConnectorTypeEnum,
  RoomProductType
} from '@src/core/enums/common.enum';
import { IsString } from 'class-validator';

export class GetListRoomProductRatePlanDto {
  @IsString()
  hotelId: string;

  @IsString()
  @IsOptional()
  roomProductId?: string;

  @IsOptional()
  @IsString()
  ratePlanId?: string;
}

export class UpdateRoomProductRatePlanConfigSettingDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomProductRatePlanId: string;

  @IsArray()
  @IsString({ each: true })
  destination: string[];

  @IsEnum(ConfiguratorTypeEnum)
  type: ConfiguratorTypeEnum;

  @IsEnum(ConfiguratorModeEnum)
  mode: ConfiguratorModeEnum;

  @IsEnum(ConnectorTypeEnum)
  connectorType: ConnectorTypeEnum;
}

export class SyncRatePlanPricingDto {
  @IsString()
  hotelId: string;

  @IsString()
  ratePlanId: string;

  @IsString()
  fromDate: string;

  @IsString()
  toDate: string;
}


export class UpdateRoomProductRatePlanSellabilityDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomProductRatePlanId: string;

  @IsBoolean()
  isSellable: boolean;
}


export class GetRoomProductRatePlanIntegrationSettingDto {
  @IsString()
  hotelId: string;

  @ArrayProperty()
  ratePlanIds: string;

  @IsEnum(RoomProductType)
  type: RoomProductType;
}