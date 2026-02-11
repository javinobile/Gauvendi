import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CreateOrUpdateFeatureDailyAdjustmentsDto } from "./dtos/create-or-update-feature-daily-adjustment.dto";
import { GetFeatureDailyAdjustmentsDto } from "./dtos/get-feature-daily-adjustment.dto";
import { RemoveFeatureDailyAdjustmentsDto } from "./dtos/remove-feature-daily-adjustment.dto";
import { FeaturePricingService } from "./feature-pricing.service";
import { MigrationFeatureAdjustmentDto } from "./dtos/migration-feature-adjustment.dto";

@Controller("feature-pricing")
export class FeaturePricingController {
  constructor(private readonly featurePricingService: FeaturePricingService) {}

  @Get("get-feature-daily-adjustments")
  async getFeatureDailyAdjustments(@Query() query: GetFeatureDailyAdjustmentsDto) {
    return await this.featurePricingService.getFeatureDailyAdjustments(query);
  }

  @Post("create-or-update-feature-daily-adjustments")
  async createOrUpdateFeatureDailyAdjustments(@Body() body: CreateOrUpdateFeatureDailyAdjustmentsDto) {
    return await this.featurePricingService.createOrUpdateFeatureDailyAdjustments(body);
  }
  @Post("remove-feature-daily-adjustments")
  async removeFeatureDailyAdjustments(@Body() body: RemoveFeatureDailyAdjustmentsDto) {
    return await this.featurePricingService.removeFeatureDailyAdjustments(body);
  }

  @Post("migration-feature-adjustment")
  async migrationFeatureAdjustment(@Body() body: MigrationFeatureAdjustmentDto) {
    return await this.featurePricingService.migrationFeatureAdjustment(body);
  }
}
