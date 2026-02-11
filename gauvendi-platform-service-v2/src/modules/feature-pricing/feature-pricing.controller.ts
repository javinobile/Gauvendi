import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { CreateOrUpdateFeatureDailyAdjustmentsDto } from './dtos/create-or-update-feature-daily-adjustment.dto';
import { GetFeatureDailyAdjustmentsDto } from './dtos/get-feature-daily-adjustment.dto';
import { RemoveFeatureDailyAdjustmentsDto } from './dtos/remove-feature-daily-adjustment.dto';
import {
  FeatureDailyAdjustmentRateListDto,
  FeaturePricingService
} from './feature-pricing.service';

@Controller('feature-pricing')
export class FeaturePricingController {
  constructor(private readonly featurePricingService: FeaturePricingService) {}

  @MessagePattern({ cmd: CMD.FEATURE_PRICING.GET_FEATURE_DAILY_ADJUSTMENTS })
  async getFeatureDailyAdjustments(
    @Payload() payload: GetFeatureDailyAdjustmentsDto
  ): Promise<FeatureDailyAdjustmentRateListDto[]> {
    return this.featurePricingService.getFeatureDailyAdjustments(payload);
  }

  @MessagePattern({ cmd: CMD.FEATURE_PRICING.CREATE_OR_UPDATE_FEATURE_DAILY_ADJUSTMENTS })
  async createOrUpdateFeatureDailyAdjustments(
    @Payload() payload: CreateOrUpdateFeatureDailyAdjustmentsDto
  ) {
    return this.featurePricingService.createOrUpdateFeatureDailyAdjustments(payload);
  }

  @MessagePattern({ cmd: CMD.FEATURE_PRICING.REMOVE_FEATURE_DAILY_ADJUSTMENTS })
  async removeFeatureDailyAdjustments(@Payload() payload: RemoveFeatureDailyAdjustmentsDto) {
    return this.featurePricingService.removeFeatureDailyAdjustments(payload);
  }

  @MessagePattern({ cmd: CMD.FEATURE_PRICING.MIGRATION_FEATURE_ADJUSTMENT })
  async migrationFeatureAdjustment(@Payload() payload: { hotelId: string }) {
    return this.featurePricingService.migrateFeatureDailyAdjustment(payload);
  }
}
