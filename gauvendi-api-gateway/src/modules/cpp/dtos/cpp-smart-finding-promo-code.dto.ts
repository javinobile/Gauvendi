import { IsOptional, IsString } from "class-validator";

export class CppSmartFindingPromoCodeQueryDto {
  @IsString()
  @IsOptional()
  propertyCode?: string;

  @IsString()
  @IsOptional()
  query?: string;
}

export enum RatePlanTypeEnum {
  PUBLIC = "PUBLIC",
  PROMOTION = "PROMOTION",
  CORPORATE = "CORPORATE",
  GROUP = "GROUP",
  BUNDLE = "BUNDLE",
}

export class CppSmartFindingPromoCodeDto {
  code: string;
  type: RatePlanTypeEnum;
  salesPlanId: string;
  salesPlanName: string;
  salesPlanCode: string;
}

