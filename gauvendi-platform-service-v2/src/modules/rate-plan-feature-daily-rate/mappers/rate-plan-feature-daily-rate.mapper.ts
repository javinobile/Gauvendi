import { Injectable } from '@nestjs/common';
import { RatePlanFeatureDailyRate } from '../../../core/entities/pricing-entities/rate-plan-feature-daily-rate.entity';
import { RatePlanFeatureDailyRateDto } from '../dto';

@Injectable()
export class RatePlanFeatureDailyRateMapper {
  entityToDto(entity: RatePlanFeatureDailyRate): RatePlanFeatureDailyRateDto {

    return {
      id: entity.id,
      ratePlanId: entity.ratePlanId,
      featureId: entity.featureId,
      rate: entity.rate,
      date: entity.date,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  entitiesToDtos(entities: RatePlanFeatureDailyRate[]): RatePlanFeatureDailyRateDto[] {
    if (!entities || entities.length === 0) return [];
    return entities.map(entity => this.entityToDto(entity));
  }
}
