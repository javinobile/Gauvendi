import { Body, Controller, Delete, Get, HttpStatus, Param, ParseFilePipeBuilder, Post, Put, Query, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Public } from "@src/core/decorators/is-public.decorator";
import { Response } from "express";
import { map } from "rxjs";
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
  RoomProductQueryDto,
  RoomProductRestrictionAutomateSettingBodyDto,
  UnassignAllRoomProductFromRatePlanDto,
  UnassignRoomProductFromRatePlanDto,
  UpdateRoomProductDto,
  UpdateRoomProductImageDto,
  UploadRoomProductImageDto,
  UploadRoomProductImagesFromGalleryDto,
} from "./room-product.dto";
import { RoomProductService } from "./room-product.service";

@Controller("room-products")
export class RoomProductController {
  constructor(private readonly roomProductService: RoomProductService) {}

  @Get()
  getRoomProducts(@Query() query: RoomProductListQueryDto) {
    return this.roomProductService.getRoomProducts(query);
  }

  @Public()
  @Get("migrate-translation")
  migrateTranslation() {
    return this.roomProductService.migrateTranslation();
  }

  @Public()
  @Get("migrate-missing-standard-feature")
  migrateMissingStandardFeature() {
    return this.roomProductService.migrateMissingStandardFeature();
  }

  @Post("cpp-product-cart-list")
  getCppProductCartList(@Body() query: CppProductCartListFilterDto) {
    return this.roomProductService.getCppProductCartList(query);
  }

  @Post("")
  createRoomProduct(@Body() body: CreateRoomProductDto) {
    return this.roomProductService.createRoomProduct(body);
  }

  @Get("rate-plan-rfc-assignment-list")
  getRatePlanRfcAssignmentList(@Query() query: GetRatePlanRfcAssignmentListDto) {
    return this.roomProductService.getRatePlanRfcAssignmentList(query);
  }

  @Post("assign-room-product-to-rate-plan")
  assignRoomProductToRatePlan(@Body() body: AssignRoomProductToRatePlanDto) {
    return this.roomProductService.assignRoomProductToRatePlan(body);
  }

  @Delete("unassign-room-product-from-rate-plan")
  unassignRoomProductFromRatePlan(@Query() query: UnassignRoomProductFromRatePlanDto) {
    return this.roomProductService.unassignRoomProductFromRatePlan(query);
  }

  @Delete("unassign-all-room-product-from-rate-plan")
  unassignAllRoomProductFromRatePlan(@Query() query: UnassignAllRoomProductFromRatePlanDto) {
    return this.roomProductService.unassignAllRoomProductFromRatePlan(query);
  }

  @Get("house-level-availability")
  getHouseLevelAvailability(@Query() query: RoomProductQueryDto) {
    const { hotelId, startDate, endDate } = query;
    return this.roomProductService.getHouseLevelAvailability(hotelId, startDate, endDate);
  }

  @Get("pms/room-products")
  getPmsRoomProducts(@Query("hotelId") hotelId: string) {
    return this.roomProductService.getPmsRoomProducts(hotelId);
  }

  @Get("pms/room-products-assignment")
  getPmsRoomProductsAssignment(@Query("hotelId") hotelId: string) {
    return this.roomProductService.getPmsRoomProductsAssignment(hotelId);
  }

  @Post("automate-settings")
  updateAutomateSetting(@Body() body: RoomProductRestrictionAutomateSettingBodyDto[]) {
    return this.roomProductService.updateAutomateSetting(body);
  }

  @Post("automate-los/restrictions")
  processAutomateLos(@Body() body: AutomateLosRequestDto) {
    return this.roomProductService.processAutomateLos(body);
  }

  @Post("automate-los/trigger")
  processAutomateLosTrigger(@Body() body: { hotelId: string }) {
    return this.roomProductService.processAutomateLosTrigger(body);
  }

  @Post(":id/extras")
  createRoomProductExtras(@Param("id") id: string, @Body() body: CreateRoomProductExtrasDto) {
    return this.roomProductService.createRoomProductExtras(id, body);
  }

  @Post(":id/extra-occupancy-rates")
  createRoomProductExtraOccupancyRates(@Param("id") id: string, @Body() body: CreateRoomProductExtraOccupancyRatesDto) {
    return this.roomProductService.createRoomProductExtraOccupancyRates(id, body);
  }

  @Post(":id/base-price-setting")
  createRoomProductBasePriceSetting(@Param("id") id: string, @Body() body: CreateRoomProductBasePriceSettingDto) {
    return this.roomProductService.createRoomProductBasePriceSetting(id, body);
  }

  @Post(":id/room-mapping")
  createRoomProductRoomMapping(@Param("id") id: string, @Body() body: CreateRoomProductRoomMappingDto) {
    return this.roomProductService.createRoomProductRoomMapping(id, body);
  }

  @Delete(":id/room-mapping")
  deleteRoomProductRoomMapping(@Param("id") id: string) {
    return this.roomProductService.deleteRoomProductRoomMapping(id);
  }

  @Post(":id/images")
  @UseInterceptors(FileInterceptor("file"))
  async uploadRoomProductImages(
    @Param("id") roomProductId: string,
    @Body() body: UploadRoomProductImageDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp("image/jpeg|image/png|image/jpg"),
        })
        .addMaxSizeValidator({
          maxSize: 2 * 1024 * 1024,
          message: "File size must be less than 2MB",
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    )
    file: any
  ) {
    return this.roomProductService.uploadRoomProductImages(roomProductId, file, body.hotelCode);
  }

  @Post(":id/images-from-gallery")
  async uploadRoomProductImagesFromGallery(@Param("id") roomProductId: string, @Body() body: UploadRoomProductImagesFromGalleryDto) {
    return this.roomProductService.uploadRoomProductImagesFromGallery(roomProductId, body.imageKeys);
  }

  @Put(":id/images/reorder")
  reorderRoomProductImages(@Param("id") roomProductId: string, @Body() body: ReorderRoomProductImageDto) {
    return this.roomProductService.reorderRoomProductImages(roomProductId, body);
  }

  @Put(":id/images/:imageId")
  updateRoomProductImage(@Param("imageId") imageId: string, @Body() body: UpdateRoomProductImageDto) {
    return this.roomProductService.updateRoomProductImage(imageId, body);
  }

  @Delete(":id/images/:imageId")
  deleteRoomProductImage(@Param("imageId") imageId: string) {
    return this.roomProductService.deleteRoomProductImage(imageId);
  }

  @Delete(":id/extras")
  deleteRoomProductExtras(@Param("id") id: string, @Body() body: DeleteRoomProductExtrasDto) {
    return this.roomProductService.deleteRoomProductExtras(id, body);
  }

  @Get(":id")
  getRoomProductDetail(@Param("id") id: string) {
    return this.roomProductService.getRoomProductDetail(id);
  }

  @Put(":id")
  updateRoomProduct(@Param("id") id: string, @Body() body: UpdateRoomProductDto) {
    return this.roomProductService.updateRoomProduct(id, body);
  }

  @Post("clone")
  cloneRoomProduct(@Body() body: CloneRoomProductDto) {
    return this.roomProductService.cloneRoomProduct(body);
  }

  @Post("get-cpp-calendar-room-products")
  getCppCalendarRoomProducts(@Body() body: CppCalendarRoomProductFilterDto) {
    return this.roomProductService.getCppCalendarRoomProducts(body);
  }

  @Post("get-cpp-calculate-room-product-price-list-v2")
  getCppCalculateRoomProductPriceListV2(@Body() dto: CppCalculateRoomProductPriceFilterDto) {
    return this.roomProductService.getCppCalculateRoomProductPriceListV2(dto);
  }

  @Post("delete-room-products")
  deleteRoomProducts(@Body() dto: DeleteRoomProductDto, @Res() res: Response) {
    return this.roomProductService.deleteRoomProducts(dto).pipe(
      map((result) => {
        return res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("bulk-upsert-retail-features")
  bulkUpsertRoomProductRetailFeatures(@Body() body: BulkUpsertRoomProductRetailFeaturesDto) {
    return this.roomProductService.bulkUpsertRoomProductRetailFeatures(body);
  }

  @Post("onboard-whip-room-product")
  onboardWhipRoomProduct(@Body() body: { hotelId: string }) {
    return this.roomProductService.onboardWhipRoomProduct(body);
  }
}
