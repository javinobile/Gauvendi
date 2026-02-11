import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { RoomProductListQueryDto } from "../room-product/room-product.dto";
import { RoomDailyAvailabilityFilter } from "./dtos/room-product-availability-daily.dto";
import {
  CalendarRoomProductAvailabilityQueryDto,
  CalendarRoomProductQueryDto,
  GenerateRoomProductAvailabilityDto,
  GetOverlappingRfcErfcForMrfcDto,
  GetRelatedMrfcDto,
  GetRoomProductMappingPmsDto,
  ProcessRoomUnitAvailabilityUpdateDto,
  RoomProductAvailabilityDto,
  RoomProductReleaseAvailabilityDto,
  SyncRoomProductAvailabilityPmsDto,
  UpsertRoomProductAvailabilityDto,
  UpsertRoomProductMappingPmsDto,
} from "./room-product-availability.dto";
import { RoomProductAvailabilityService } from "./room-product-availability.service";

@Controller("room-product-availability")
export class RoomProductAvailabilityController {
  constructor(private readonly roomProductAvailabilityService: RoomProductAvailabilityService) {}

  @Get("")
  getRoomProductsAvailability(@Query() query: RoomProductListQueryDto) {
    return this.roomProductAvailabilityService.getRoomProductsAvailability(query);
  }

  @Post("calendar")
  getCalendar(@Body() body: CalendarRoomProductQueryDto) {
    return this.roomProductAvailabilityService.getCalendar(body);
  }

  @Post("calendar-specific-room-product")
  getCalendarSpecificRoomProduct(@Body() body: CalendarRoomProductAvailabilityQueryDto) {
    return this.roomProductAvailabilityService.getCalendarSpecificRoomProduct(body);
  }

  @Get("pms/room-product-mapping")
  getSettingPmsRoomProductMapping(@Query("hotelId") hotelId: string) {
    return this.roomProductAvailabilityService.getSettingPmsRoomProductMapping(hotelId);
  }

  @Post("upsert-room-product-mapping-pms")
  upsertRoomProductMappingPms(@Body() body: UpsertRoomProductMappingPmsDto[]) {
    return this.roomProductAvailabilityService.upsertRoomProductMappingPms(body);
  }

  @Delete("room-product-mapping-pms/:id")
  deleteRoomProductMappingPms(@Param("id") id: string) {
    return this.roomProductAvailabilityService.deleteRoomProductMappingPms(id);
  }

  @Post("sync-room-product-availability-pms")
  syncRoomProductAvailabilityPms(@Body() body: SyncRoomProductAvailabilityPmsDto) {
    return this.roomProductAvailabilityService.syncRoomProductAvailabilityPms(body);
  }

  @Post("upsert-room-product-availability")
  upsertRoomProductAvailability(@Body() body: UpsertRoomProductAvailabilityDto) {
    return this.roomProductAvailabilityService.upsertRoomProductAvailability(body);
  }

  @Post("check-availability")
  roomProductCheckAvailability(@Body() body: RoomProductAvailabilityDto) {
    return this.roomProductAvailabilityService.roomProductCheckAvailability(body);
  }

  @Get("linked-mrfc")
  getOverlappingRfcErfcForMrfc(@Query() query: GetOverlappingRfcErfcForMrfcDto) {
    return this.roomProductAvailabilityService.getOverlappingRfcErfcForMrfc(query);
  }

  @Post("release-availability")
  roomProductReleaseAvailability(@Body() body: RoomProductReleaseAvailabilityDto) {
    return this.roomProductAvailabilityService.roomProductReleaseAvailability(body);
  }

  @Post("process-unit-availability-update")
  processRoomUnitAvailabilityUpdate(@Body() body: ProcessRoomUnitAvailabilityUpdateDto) {
    return this.roomProductAvailabilityService.processRoomUnitAvailabilityUpdate(body);
  }

  @Post("generate-room-product-availability")
  generateRoomProductAvailability(@Body() body: GenerateRoomProductAvailabilityDto) {
    return this.roomProductAvailabilityService.generateRoomProductAvailability(body);
  }

  @Post("room-product-mapping-pms")
  getRoomProductMappingPms(@Body() body: GetRoomProductMappingPmsDto) {
    return this.roomProductAvailabilityService.getRoomProductMappingPms(body);
  }

  @Get("related-mrfc")
  getRelatedMrfc(@Query() query: GetRelatedMrfcDto) {
    return this.roomProductAvailabilityService.getRelatedMrfc(query);
  }

  @Get("daily")
  getRoomProductAvailability(@Query() query: RoomDailyAvailabilityFilter) {
    return this.roomProductAvailabilityService.getRoomProductAvailability(query);
  }
}
