import { Injectable } from '@nestjs/common';
import { RatePlanExtraService, RatePlanExtraServiceType } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanExtraServicesDto } from '../dtos/rate-plan-services.dto';

@Injectable()
export class ExtraServiceSettingsMapper {
  toDto(entity: RatePlanExtraService): RatePlanExtraServicesDto {
    return {
      ratePlanId: entity.ratePlanId,
      serviceId: entity.extrasId,
      isIncluded: entity.type === RatePlanExtraServiceType.INCLUDED,
      isMandatory: entity.type === RatePlanExtraServiceType.MANDATORY
    };
  }
}
