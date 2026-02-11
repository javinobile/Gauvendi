import { IsArray, IsEnum, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { ArrayProperty } from "src/core/decorators/array-property.decorator";
import { RatePlanExtraServiceType } from "src/core/enums/common.enum";
import { Filter } from "src/core/dtos/common.dto";
import { Type } from "class-transformer";

export class RatePlanServiceListPricingFilterDto extends Filter {
  @ArrayProperty()
  @IsUUID("4", { each: true })
  ratePlanIdList: string[];
}

export class RatePlanServiceListPricingResponseDto {
  id: string;
  ratePlanId: string;
  serviceId: string;
  type: string;
  service: {
    name: string;
    code: string;
    pricingUnit: string;
    iconImageUrl: string;
    description: string;
    totalSellingRate: number;
  };
}

export class RatePlanServiceInputServiceDto {
  @IsUUID("4")
  id: string;

  @IsEnum(RatePlanExtraServiceType)
  @IsOptional()
  type?: RatePlanExtraServiceType;
}

export class RatePlanServiceInputDto {
  @IsUUID("4")
  ratePlanId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatePlanServiceInputServiceDto)
  services: RatePlanServiceInputServiceDto[];
}

export class RatePlanServiceDeleteInputDto {
  @IsUUID("4")
  ratePlanId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatePlanServiceInputServiceDto)
  services: RatePlanServiceInputServiceDto[];
}
