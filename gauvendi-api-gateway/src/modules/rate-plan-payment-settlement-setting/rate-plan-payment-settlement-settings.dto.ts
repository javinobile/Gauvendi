import { RatePlanPaymentSettlementSettingModeEnum } from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

export class RatePlanPaymentSettlementSettingInputDto {
  @IsOptional()
  id: string;

  @IsString()
  @IsNotEmpty()
  salesPlanId: string;

  @IsEnum(RatePlanPaymentSettlementSettingModeEnum)
  @IsNotEmpty()
  mode: RatePlanPaymentSettlementSettingModeEnum;
}

export class RatePlanPaymentSettlementSettingListInput {
  @IsString()
  @IsNotEmpty()
  propertyCode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatePlanPaymentSettlementSettingInputDto)
  settingList: RatePlanPaymentSettlementSettingInputDto[];
}
