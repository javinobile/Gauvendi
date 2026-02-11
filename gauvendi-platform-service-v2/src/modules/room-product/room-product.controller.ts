import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import {
  AssignRoomProductToRatePlanDto,
  BulkUpsertRoomProductRetailFeaturesDto,
  CloneRoomProductInput,
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
  RoomProductQueryDto,
  UnassignAllRoomProductFromRatePlanDto,
  UnassignRoomProductFromRatePlanDto,
  UpdateRoomProductDto,
  UpdateRoomProductImageDto,
  UploadRoomProductImagesFromGalleryDto
} from './room-product.dto';
import { RoomProductService } from './room-product.service';

@Controller('room-products')
export class RoomProductController {
  constructor(private readonly roomProductService: RoomProductService) {}

  @MessagePattern({ cmd: 'get_room_products' })
  getRoomProducts(@Payload() query: RoomProductListQueryDto) {
    return this.roomProductService.getRoomProducts(query);
  }

  @MessagePattern({ cmd: 'room_product_migrate_translation' })
  migrateTranslation() {
    return this.roomProductService.migrateTranslation();
  }

  @MessagePattern({ cmd: 'create_room_product' })
  createRoomProduct(@Payload() body: CreateRoomProductDto) {
    return this.roomProductService.createRoomProduct(body);
  }

  @MessagePattern({ cmd: CMD.ROOM_PRODUCT.CLONE })
  cloneRoomProduct(@Payload() body: CloneRoomProductInput) {
    return this.roomProductService.cloneRoomProduct(body);
  }

  @MessagePattern({ cmd: 'get_house_level_availability' })
  getHouseLevelAvailability(@Payload() query: RoomProductQueryDto) {
    return this.roomProductService.getHouseLevelAvailability(query);
  }

  @MessagePattern({ cmd: 'get_pms_room_products' })
  getPmsRoomProducts(@Payload() hotelId: string) {
    return this.roomProductService.getPmsRoomProducts(hotelId);
  }

  @MessagePattern({ cmd: 'get_pms_room_products_assignment' })
  getPmsRoomProductsAssignment(@Payload() hotelId: string) {
    return this.roomProductService.getPmsRoomProductsAssignment(hotelId);
  }

  @MessagePattern({ cmd: 'create_room_product_extras' })
  createRoomProductExtras(
    @Payload() { id, body }: { id: string; body: CreateRoomProductExtrasDto }
  ) {
    return this.roomProductService.createRoomProductExtras(id, body);
  }

  @MessagePattern({ cmd: 'create_room_product_extra_occupancy_rates' })
  createRoomProductExtraOccupancyRates(
    @Payload() { id, body }: { id: string; body: CreateRoomProductExtraOccupancyRatesDto }
  ) {
    return this.roomProductService.createRoomProductExtraOccupancyRates(id, body);
  }

  @MessagePattern({ cmd: 'create_room_product_base_price_setting' })
  createRoomProductBasePriceSetting(
    @Payload() { id, body }: { id: string; body: CreateRoomProductBasePriceSettingDto }
  ) {
    return this.roomProductService.createRoomProductBasePriceSetting(id, body);
  }

  @MessagePattern({ cmd: 'create_room_product_room_mapping' })
  createRoomProductRoomMapping(
    @Payload() { id, body }: { id: string; body: CreateRoomProductRoomMappingDto }
  ) {
    return this.roomProductService.createRoomProductRoomMapping(id, body);
  }

  @MessagePattern({ cmd: 'delete_room_product_room_mapping' })
  deleteRoomProductRoomMapping(@Payload() id: string) {
    return this.roomProductService.deleteRoomProductRoomMapping(id);
  }

  @MessagePattern({ cmd: 'upload_room_product_images' })
  async uploadRoomProductImages(
    @Payload() { id, hotelCode, file }: { id: string; hotelCode: string; file: any }
  ) {
    return this.roomProductService.uploadRoomProductImages(id, file, hotelCode);
  }

  @MessagePattern({ cmd: 'upload_room_product_images_from_gallery' })
  async uploadRoomProductImagesFromGallery(
    @Payload() payload: UploadRoomProductImagesFromGalleryDto
  ) {
    return this.roomProductService.uploadRoomProductImagesFromGallery(payload);
  }

  @MessagePattern({ cmd: 'reorder_room_product_images' })
  reorderRoomProductImages(
    @Payload() { id, body }: { id: string; body: ReorderRoomProductImageDto }
  ) {
    return this.roomProductService.reorderRoomProductImages(id, body);
  }

  @MessagePattern({ cmd: 'update_room_product_image' })
  updateRoomProductImage(@Payload() { id, body }: { id: string; body: UpdateRoomProductImageDto }) {
    return this.roomProductService.updateRoomProductImage(id, body);
  }

  @MessagePattern({ cmd: 'delete_room_product_image' })
  deleteRoomProductImage(@Payload() id: string) {
    return this.roomProductService.deleteRoomProductImage(id);
  }

  @MessagePattern({ cmd: 'delete_room_product_extras' })
  deleteRoomProductExtras(
    @Payload() { id, body }: { id: string; body: DeleteRoomProductExtrasDto }
  ) {
    return this.roomProductService.deleteRoomProductExtras(id, body);
  }

  @MessagePattern({ cmd: 'get_room_product_detail' })
  getRoomProductDetail(@Payload() id: string) {
    return this.roomProductService.getRoomProductDetail(id);
  }

  @MessagePattern({ cmd: 'update_room_product' })
  updateRoomProduct(@Payload() { id, body }: { id: string; body: UpdateRoomProductDto }) {
    return this.roomProductService.updateRoomProduct(id, body);
  }

  @MessagePattern({ cmd: 'get_rate_plan_rfc_assignment_list' })
  getRatePlanRfcAssignmentList(@Payload() payload: GetRatePlanRfcAssignmentListDto) {
    return this.roomProductService.getRatePlanRfcAssignmentList(payload);
  }

  @MessagePattern({ cmd: 'assign_room_product_to_rate_plan' })
  assignRoomProductToRatePlan(@Payload() payload: AssignRoomProductToRatePlanDto) {
    return this.roomProductService.assignRoomProductToRatePlan(payload);
  }

  @MessagePattern({ cmd: 'unassign_room_product_from_rate_plan' })
  unassignRoomProductFromRatePlan(@Payload() payload: UnassignRoomProductFromRatePlanDto) {
    return this.roomProductService.unassignRoomProductFromRatePlan(payload);
  }

  @MessagePattern({ cmd: 'unassign_all_room_product_from_rate_plan' })
  unassignAllRoomProductFromRatePlan(@Payload() payload: UnassignAllRoomProductFromRatePlanDto) {
    return this.roomProductService.unassignAllRoomProductFromRatePlan(payload);
  }

  @MessagePattern({ cmd: CMD.ROOM_PRODUCT.GET_CPP_PRODUCT_CART_LIST })
  getCPPProductCartList(@Payload() payload: CppProductCartListFilterDto) {
    return this.roomProductService.getCPPProductCartList(payload);
  }

  @MessagePattern({ cmd: CMD.ROOM_PRODUCT.DELETE_ROOM_PRODUCTS })
  deleteRoomProducts(@Payload() payload: DeleteRoomProductDto) {
    return this.roomProductService.deleteRoomProducts(payload);
  }

  @MessagePattern({ cmd: CMD.ROOM_PRODUCT.MIGRATE_MISSING_STANDARD_FEATURE })
  migrateMissingStandardFeature() {
    return this.roomProductService.migrateMissingStandardFeature();
  }

  @MessagePattern({ cmd: 'bulk_upsert_room_product_retail_features' })
  bulkUpsertRoomProductRetailFeatures(@Payload() payload: BulkUpsertRoomProductRetailFeaturesDto) {
    return this.roomProductService.bulkUpsertRoomProductRetailFeatures(payload);
  }

  @MessagePattern({ cmd: 'onboard_whip_room_product' })
  onboardWhipRoomProduct(@Payload() payload: { hotelId: string }) {
    return this.roomProductService.onboardWhipRoomProduct(payload.hotelId);
  }
}
