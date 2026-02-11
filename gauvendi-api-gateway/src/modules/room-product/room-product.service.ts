import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { CppCalculateRoomProductPriceFilterDto } from "./dtos/cpp-calculate-room-product-price.dto";
import { CppCalendarRoomProductFilterDto } from "./dtos/cpp-calendar-room-product.dto";
import {
  AssignRoomProductToRatePlanDto,
  AutomateLosRequestDto,
  BulkUpsertRoomProductRetailFeaturesDto,
  CloneRoomProductDto,
  CppProductCartListFilterDto,
  CreateRoomProductBasePriceSettingDto,
  CreateRoomProductDto,
  CreateRoomProductExtraOccupancyRatesDto,
  CreateRoomProductExtrasDto,
  CreateRoomProductRoomMappingDto,
  DeleteRoomProductDto,
  DeleteRoomProductExtrasDto,
  GetRatePlanRfcAssignmentListDto,
  ReorderRoomProductImageDto,
  RoomProductListQueryDto,
  RoomProductRestrictionAutomateSettingBodyDto,
  UnassignAllRoomProductFromRatePlanDto,
  UnassignRoomProductFromRatePlanDto,
  UpdateRoomProductDto,
  UpdateRoomProductImageDto,
} from "./room-product.dto";

@Injectable()
export class RoomProductService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getRoomProducts(query: RoomProductListQueryDto) {
    return this.platformClient.send({ cmd: "get_room_products" }, query);
  }

  migrateTranslation() {
    return this.platformClient.send({ cmd: "room_product_migrate_translation" }, {});
  }

  migrateMissingStandardFeature() {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT.MIGRATE_MISSING_STANDARD_FEATURE }, {});
  }

  createRoomProduct(body: CreateRoomProductDto) {
    return this.platformClient.send({ cmd: "create_room_product" }, body);
  }

  getHouseLevelAvailability(hotelId: string, startDate: string, endDate: string) {
    return this.platformClient.send({ cmd: "get_house_level_availability" }, { hotelId, startDate, endDate });
  }

  updateRoomProduct(id: string, body: UpdateRoomProductDto) {
    return this.platformClient.send({ cmd: "update_room_product" }, { id, body });
  }

  deleteRoomProduct(id: string) {
    return this.platformClient.send({ cmd: "delete_room_product" }, { id });
  }

  createRoomProductBasePriceSetting(id: string, body: CreateRoomProductBasePriceSettingDto) {
    return this.platformClient.send({ cmd: "create_room_product_base_price_setting" }, { id, body });
  }

  createRoomProductExtraOccupancyRates(id: string, body: CreateRoomProductExtraOccupancyRatesDto) {
    return this.platformClient.send({ cmd: "create_room_product_extra_occupancy_rates" }, { id, body });
  }

  createRoomProductExtras(id: string, body: CreateRoomProductExtrasDto) {
    return this.platformClient.send({ cmd: "create_room_product_extras" }, { id, body });
  }

  createRoomProductRoomMapping(id: string, body: CreateRoomProductRoomMappingDto) {
    return this.platformClient.send({ cmd: "create_room_product_room_mapping" }, { id, body });
  }

  deleteRoomProductRoomMapping(id: string) {
    return this.platformClient.send({ cmd: "delete_room_product_room_mapping" }, id);
  }

  uploadRoomProductImages(id: string, file: any, hotelCode: string) {
    return this.platformClient.send({ cmd: "upload_room_product_images" }, { id, file, hotelCode });
  }

  uploadRoomProductImagesFromGallery(id: string, imageKeys: string[]) {
    return this.platformClient.send({ cmd: "upload_room_product_images_from_gallery" }, { id, imageKeys });
  }

  reorderRoomProductImages(id: string, body: ReorderRoomProductImageDto) {
    return this.platformClient.send({ cmd: "reorder_room_product_images" }, { id, body });
  }

  updateRoomProductImage(id: string, body: UpdateRoomProductImageDto) {
    return this.platformClient.send({ cmd: "update_room_product_image" }, { id, body });
  }

  deleteRoomProductImage(id: string) {
    return this.platformClient.send({ cmd: "delete_room_product_image" }, id);
  }

  deleteRoomProductExtras(id: string, body: DeleteRoomProductExtrasDto) {
    return this.platformClient.send({ cmd: "delete_room_product_extras" }, { id, body });
  }

  getRoomProductDetail(id: string) {
    return this.platformClient.send({ cmd: "get_room_product_detail" }, id);
  }

  getRoomProductPricingMode(id: string) {
    return this.platformClient.send({ cmd: "get_room_product_pricing_mode" }, { id });
  }

  updateAutomateSetting(body: RoomProductRestrictionAutomateSettingBodyDto[]) {
    return this.platformClient.send({ cmd: "update_automate_setting" }, body);
  }

  processAutomateLos(body: AutomateLosRequestDto) {
    return this.platformClient.send({ cmd: "process_automate_los" }, body);
  }

  processAutomateLosTrigger(body: { hotelId: string }) {
    return this.platformClient.send({ cmd: "trigger_los_restriction" }, body);
  }

  getPmsRoomProducts(hotelId: string) {
    return this.platformClient.send({ cmd: "get_pms_room_products" }, hotelId);
  }

  getPmsRoomProductsAssignment(hotelId: string) {
    return this.platformClient.send({ cmd: "get_pms_room_products_assignment" }, hotelId);
  }

  getRatePlanRfcAssignmentList(query: GetRatePlanRfcAssignmentListDto) {
    return this.platformClient.send({ cmd: "get_rate_plan_rfc_assignment_list" }, query);
  }

  assignRoomProductToRatePlan(body: AssignRoomProductToRatePlanDto) {
    return this.platformClient.send({ cmd: "assign_room_product_to_rate_plan" }, body);
  }

  unassignRoomProductFromRatePlan(body: UnassignRoomProductFromRatePlanDto) {
    return this.platformClient.send({ cmd: "unassign_room_product_from_rate_plan" }, body);
  }

  unassignAllRoomProductFromRatePlan(body: UnassignAllRoomProductFromRatePlanDto) {
    return this.platformClient.send({ cmd: "unassign_all_room_product_from_rate_plan" }, body);
  }

  cloneRoomProduct(body: CloneRoomProductDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT.CLONE }, body);
  }

  getCppCalendarRoomProducts(body: CppCalendarRoomProductFilterDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT.GET_CPP_CALENDAR_ROOM_PRODUCTS }, body);
  }

  getCppProductCartList(query: CppProductCartListFilterDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT.GET_CPP_PRODUCT_CART_LIST }, query);
  }

  getCppCalculateRoomProductPriceListV2(body: CppCalculateRoomProductPriceFilterDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT.GET_CPP_CALCULATE_ROOM_PRODUCT_PRICE_LIST_V2 }, body);
  }

  deleteRoomProducts(body: DeleteRoomProductDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT.DELETE_ROOM_PRODUCTS }, body);
  }

  bulkUpsertRoomProductRetailFeatures(body: BulkUpsertRoomProductRetailFeaturesDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT.BULK_UPSERT_ROOM_PRODUCT_RETAIL_FEATURES }, body);
  }

  onboardWhipRoomProduct(body: { hotelId: string }) {
    return this.platformClient.send({ cmd: "onboard_whip_room_product" }, body);
  }
}
