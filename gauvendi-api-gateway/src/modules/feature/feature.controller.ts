import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
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
import { FeatureService } from "./feature.service";
import { CacheKey, CacheTTL } from "@nestjs/cache-manager";
import { Public } from "@src/core/decorators/is-public.decorator";

@Controller("features")
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get("hotel-retail-category/migrate-translation")
  @Public()
  migrateTranslation() {
    return this.featureService.migrateHotelRetailCategoryTranslation();
  }

  @Get("hotel-standard-feature/migrate-translation")
  @Public()
  migrateStandardFeatureTranslation() {
    return this.featureService.migrateHotelStandardFeatureTranslation();
  }

  @Get("master-template/:type")
  async getMasterTemplate(@Param("type") type: "STANDARD" | "RETAIL") {
    return this.featureService.getMasterTemplate(type);
  }

  @Get("master-template/sync-retail/:hotelId")
  async syncIconImageRetailByCode(@Param("hotelId") hotelId: string, @Query("force") force: boolean = false) {
    return this.featureService.syncIconImageRetailByCode(hotelId, force);
  }

  @Get("master-template/sync-standard/:hotelId")
  async syncIconImageStandardByCode(@Param("hotelId") hotelId: string, @Query("force") force: boolean = false) {
    return this.featureService.syncIconImageStandardByCode(hotelId, force);
  }

  @Get("categories")
  @CacheTTL(60 * 60 * 1000) // 1 hour
  async getHotelRetailCategories(@Query() query: GetHotelRetailCategoriesDto) {
    return this.featureService.getHotelRetailCategories(query);
  }

  @Get("retails")
  async getHotelRetailFeatures(@Query() query: GetHotelRetailFeaturesDto) {

    return this.featureService.getHotelRetailFeatures(query);
  }

  @Put("retail/visibility")
  async updateRetailVisibility(@Body() body: UpdateRetailVisibilityDto) {
    return this.featureService.updateRetailVisibility(body);
  }

  @Put("retail/bulk-update")
  async bulkUpdateRetailFeature(@Body() body: BulkUpdateRetailFeaturesDto) {
    return this.featureService.bulkUpdateRetailFeature(body);
  }

  @Put("categories/price-weight")
  async updateCategoryPriceWeight(@Body() body: UpdateCategoryPriceWeightDto[]) {
    return this.featureService.updateCategoryPriceWeight(body);
  }

  @Put("retail")
  async updateRetailInfo(@Body() body: UpdateRetailInfoDto) {
    return this.featureService.updateRetailInfo(body);
  }

  @Post("retails/bulk-create")
  async bulkCreateRetailFeature(@Body() body: BulkCreateRetailFeatureDto) {
    return this.featureService.bulkCreateRetailFeature(body);
  }

  @Get("standard")
  async getStandardFeatures(@Query() query: GetStandardFeaturesDto) {
    return this.featureService.getStandardFeatures(query);
  }

  @Post("standard/bulk-create")
  async bulkCreateStandardFeature(@Body() body: BulkCreateStandardFeatureDto) {
    return this.featureService.bulkCreateStandardFeature(body);
  }

  @Put("standard")
  async updateStandardInfo(@Body() body: UpdateStandardInfoDto) {
    return this.featureService.updateStandardInfo(body);
  }

  @Delete("standard/:id")
  async deleteStandardFeature(@Param("id") id: string) {
    return this.featureService.deleteStandardFeature(id);
  }

  @Delete("retail/:id")
  async deleteRetailFeature(@Param("id") id: string, @Body() body: DeleteRetailFeatureDto) {
    return this.featureService.deleteRetailFeature(id, body);
  }

  @Get("")
  async getHotelFeature(@Query() query: HotelFeatureFilterDto) {
    return this.featureService.getHotelFeature(query);
  }

  @Post("sync")
  async syncFeature(@Body() body: HotelFeatureFilterDto) {
    return this.featureService.syncFeature(body);
  }
}
