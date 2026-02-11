import { HotelRestrictionCodeEnum, HotelRestrictionSettingMode, RestrictionEntity } from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { ArrayProperty, OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Optional } from "@nestjs/common";

export class GetHotelIntegrationRestrictionSettingListQuery {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  modeList: HotelRestrictionSettingMode[];

  @OptionalArrayProperty()
  salesPlanIdList?: string[];
}

export class HotelIntegrationRestrictionSettingDetailInput {
  @IsEnum(HotelRestrictionSettingMode)
  @IsNotEmpty()
  mode: HotelRestrictionSettingMode;

  @IsEnum(HotelRestrictionCodeEnum)
  @IsNotEmpty()
  restrictionCode: HotelRestrictionCodeEnum;
}

export class HotelIntegrationRestrictionSettingInputDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  integrationMappingCode?: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsEnum(RestrictionEntity)
  @IsOptional()
  restrictionEntity?: RestrictionEntity;

  @IsUUID()
  @IsOptional()
  roomProductId?: string;

  @IsUUID()
  @IsOptional()
  salesPlanId?: string;

  @IsArray()
  @IsEnum(HotelRestrictionSettingMode, { each: true })
  @IsNotEmpty()
  modeList?: HotelRestrictionSettingMode[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HotelIntegrationRestrictionSettingDetailInput)
  settingList?: HotelIntegrationRestrictionSettingDetailInput[];
}


export class SyncPmsRestrictionSettingDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsEnum(RestrictionEntity)
  @IsNotEmpty()
  restrictionEntity: RestrictionEntity;
}