import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { HotelFeatureFilterDto } from "./dtos/hotel-feature-filter.dto";
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
  UpdateStandardInfoDto,
} from "./feature.dto";

@Injectable()
export class FeatureService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  migrateHotelRetailCategoryTranslation() {
    return this.platformClient.send({ cmd: "migrate_hotel_retail_category_translation" }, {});
  }

  migrateHotelStandardFeatureTranslation() {
    return this.platformClient.send({ cmd: "migrate_hotel_standard_feature_translation" }, {});
  }

  getMasterTemplate(type: "STANDARD" | "RETAIL") {
    return this.platformClient.send({ cmd: "get_master_template" }, type);
  }

  syncIconImageRetailByCode(hotelId: string, force: boolean = false) {
    return this.platformClient.send({ cmd: "sync_icon_image_retail_by_code" }, { hotelId, force });
  }

  syncIconImageStandardByCode(hotelId: string, force: boolean = false) {
    return this.platformClient.send({ cmd: "sync_icon_image_standard_by_code" }, { hotelId, force });
  }

  getHotelRetailCategories(query: GetHotelRetailCategoriesDto) {
    return this.platformClient.send({ cmd: "get_hotel_retail_categories" }, query);
  }

  getHotelRetailFeatures(query: GetHotelRetailFeaturesDto) {
    return this.platformClient.send({ cmd: "get_hotel_retail_features" }, query);
  }

  updateRetailVisibility(body: UpdateRetailVisibilityDto) {
    return this.platformClient.send({ cmd: "update_retail_visibility" }, body);
  }

  bulkUpdateRetailFeature(body: BulkUpdateRetailFeaturesDto) {
    return this.platformClient.send({ cmd: "bulk_update_retail_feature" }, body);
  }

  updateCategoryPriceWeight(body: UpdateCategoryPriceWeightDto[]) {
    return this.platformClient.send({ cmd: "update_category_price_weight" }, body);
  }

  updateRetailInfo(body: UpdateRetailInfoDto) {
    return this.platformClient.send({ cmd: "update_retail_info" }, body);
  }

  bulkCreateRetailFeature(body: BulkCreateRetailFeatureDto) {
    return this.platformClient.send({ cmd: "bulk_create_retail_feature" }, body);
  }

  getStandardFeatures(query: GetStandardFeaturesDto) {
    return this.platformClient.send({ cmd: "get_standard_features" }, query);
  }

  bulkCreateStandardFeature(body: BulkCreateStandardFeatureDto) {
    return this.platformClient.send({ cmd: "bulk_create_standard_feature" }, body);
  }

  updateStandardInfo(body: UpdateStandardInfoDto) {
    return this.platformClient.send({ cmd: "update_standard_info" }, body);
  }

  deleteStandardFeature(id: string) {
    return this.platformClient.send({ cmd: "delete_standard_feature" }, id);
  }

  deleteRetailFeature(id: string, body: DeleteRetailFeatureDto) {
    return this.platformClient.send({ cmd: "delete_retail_feature" }, { id, ...body });
  }

  getHotelFeature(query: HotelFeatureFilterDto) {
    return this.platformClient.send({ cmd: CMD.FEATURE.GET_HOTEL_FEATURE }, query);
  }

  syncFeature(body: HotelFeatureFilterDto) {
    return this.platformClient.send({ cmd: CMD.FEATURE.SYNC_FEATURE }, body);
  }
}
