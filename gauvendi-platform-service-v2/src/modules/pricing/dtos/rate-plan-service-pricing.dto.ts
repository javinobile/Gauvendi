import { IsArray, IsUUID } from 'class-validator';
import { ArrayProperty } from 'src/core/decorators/array-property.decorator';
import { RatePlanExtraServiceType } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { Filter } from '../../../core/dtos/common.dto';

export class RatePlanServiceListPricingFilterDto extends Filter {
  @ArrayProperty()
  @IsUUID('4', { each: true })
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

export class RatePlanServiceInputDto {
  @IsUUID('4')
  ratePlanId: string;

  @IsArray()
  services: {
    id: string;
    type: RatePlanExtraServiceType;
  }[];
}

export class RatePlanServiceDeleteInputDto {
  @IsUUID('4')
  ratePlanId: string;

  @IsArray()
  services: {
    id: string;
  }[];
}
