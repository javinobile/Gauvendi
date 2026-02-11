import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { HotelFeatureFilterDto } from './dtos/hotel-feature-filter.dto';
import {
  BulkCreateRetailFeatureDto,
  BulkCreateStandardFeatureDto,
  BulkUpdateRetailFeaturesDto,
  DeleteRetailFeatureDto,
  GetHotelRetailCategoriesDto,
  GetHotelRetailFeaturesDto,
  GetStandardFeaturesDto,
  UpdateCategoryPriceWeightDto,
  UpdateRetailInfoDto,
  UpdateRetailVisibilityDto,
  UpdateStandardInfoDto
} from './feature.dto';
import { FeatureService } from './feature.service';

@Controller('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @MessagePattern({ cmd: 'migrate_hotel_retail_category_translation' })
  async migrateHotelRetailCategoryTranslation() {
    return this.featureService.migrateHotelRetailCategoryTranslation();
  }

  @MessagePattern({ cmd: 'migrate_hotel_standard_feature_translation' })
  async migrateHotelStandardFeatureTranslation() {
    return this.featureService.migrateHotelStandardFeatureTranslation();
  }

  @MessagePattern({ cmd: 'get_master_template' })
  async getMasterTemplate(@Payload() type: 'STANDARD' | 'RETAIL') {
    return this.featureService.getMasterTemplate(type);
  }

  @MessagePattern({ cmd: 'sync_icon_image_retail_by_code' })
  async syncIconImageRetailByCode(
    @Payload() { hotelId, force }: { hotelId: string; force: boolean }
  ) {
    return this.featureService.syncIconImageRetailByCode(hotelId, force);
  }

  @MessagePattern({ cmd: 'sync_icon_image_standard_by_code' })
  async syncIconImageStandardByCode(
    @Payload() { hotelId, force }: { hotelId: string; force: boolean }
  ) {
    return this.featureService.syncIconImageStandardByCode(hotelId, force);
  }

  @MessagePattern({ cmd: 'get_hotel_retail_categories' })
  async getHotelRetailCategories(@Payload() query: GetHotelRetailCategoriesDto) {
    return this.featureService.getHotelRetailCategories(query);
  }

  @MessagePattern({ cmd: 'get_hotel_retail_features' })
  async getHotelRetailFeatures(@Payload() query: GetHotelRetailFeaturesDto) {
    return this.featureService.getHotelRetailFeatures(query);
  }

  @MessagePattern({ cmd: 'update_retail_visibility' })
  async updateRetailVisibility(@Payload() body: UpdateRetailVisibilityDto) {
    return this.featureService.updateRetailVisibility(body);
  }

  @MessagePattern({ cmd: 'bulk_update_retail_feature' })
  async bulkUpdateRetailFeature(@Payload() body: BulkUpdateRetailFeaturesDto) {
    return this.featureService.bulkUpdateRetailFeatures(body);
  }

  @MessagePattern({ cmd: 'update_category_price_weight' })
  async updateCategoryPriceWeight(@Payload() body: UpdateCategoryPriceWeightDto[]) {
    return this.featureService.updateCategoryPriceWeight(body);
  }

  @MessagePattern({ cmd: 'update_retail_info' })
  async updateRetailInfo(@Payload() body: UpdateRetailInfoDto) {
    return this.featureService.updateRetailInfo(body);
  }

  @MessagePattern({ cmd: 'bulk_create_retail_feature' })
  async bulkCreateRetailFeature(@Payload() body: BulkCreateRetailFeatureDto) {
    return this.featureService.bulkCreateRetailFeature(body);
  }

  @MessagePattern({ cmd: 'get_standard_features' })
  async getStandardFeatures(@Payload() query: GetStandardFeaturesDto) {
    return this.featureService.getStandardFeatures(query);
  }

  @MessagePattern({ cmd: 'bulk_create_standard_feature' })
  async bulkCreateStandardFeature(@Payload() body: BulkCreateStandardFeatureDto) {
    return this.featureService.bulkCreateStandardFeature(body);
  }

  @MessagePattern({ cmd: 'update_standard_info' })
  async updateStandardInfo(@Payload() body: UpdateStandardInfoDto) {
    return this.featureService.updateStandardInfo(body);
  }

  @MessagePattern({ cmd: 'delete_standard_feature' })
  async deleteStandardFeature(@Payload() id: string) {
    return this.featureService.deleteStandardFeature(id);
  }

  @MessagePattern({ cmd: 'delete_retail_feature' })
  async deleteRetailFeature(@Payload() body: DeleteRetailFeatureDto) {
    return this.featureService.deleteRetailFeature(body);
  }

  @MessagePattern({ cmd: CMD.FEATURE.GET_HOTEL_FEATURE })
  async getHotelFeatures(@Payload() filter: HotelFeatureFilterDto) {
    return this.featureService.getHotelFeatures(filter);
  }

  @MessagePattern({ cmd: CMD.FEATURE.SYNC_FEATURE })
  async syncFeature(@Payload() filter: HotelFeatureFilterDto) {
    return this.featureService.syncFeature(filter);
  }
}
