import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { CreateOrUpdateFeatureDailyAdjustmentsDto } from "./dtos/create-or-update-feature-daily-adjustment.dto";
import { GetFeatureDailyAdjustmentsDto } from "./dtos/get-feature-daily-adjustment.dto";
import { RemoveFeatureDailyAdjustmentsDto } from "./dtos/remove-feature-daily-adjustment.dto";
import { MigrationFeatureAdjustmentDto } from "./dtos/migration-feature-adjustment.dto";

@Injectable()
export class FeaturePricingService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  async getFeatureDailyAdjustments(query: GetFeatureDailyAdjustmentsDto) {
    return await this.platformClient.send({ cmd: CMD.FEATURE_PRICING.GET_FEATURE_DAILY_ADJUSTMENTS }, query);
  }

  async createOrUpdateFeatureDailyAdjustments(body: CreateOrUpdateFeatureDailyAdjustmentsDto) {
    return await this.platformClient.send({ cmd: CMD.FEATURE_PRICING.CREATE_OR_UPDATE_FEATURE_DAILY_ADJUSTMENTS }, body);
  }

  async removeFeatureDailyAdjustments(body: RemoveFeatureDailyAdjustmentsDto) {
    return await this.platformClient.send({ cmd: CMD.FEATURE_PRICING.REMOVE_FEATURE_DAILY_ADJUSTMENTS }, body);
  }

  async migrationFeatureAdjustment(body: MigrationFeatureAdjustmentDto) {
    return await this.platformClient.send({ cmd: CMD.FEATURE_PRICING.MIGRATION_FEATURE_ADJUSTMENT }, body);
  }
}
