import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import {
  BulkDeleteRestrictionDto,
  BulkRestrictionOperationDto,
  CalendarRestrictionDto,
  CreatePmsRestrictionDto,
  CreateRestrictionDto,
  GetHotelRestrictionsDto,
  GetRatePlanRestrictionsDto,
  GetRestrictionsDto,
  GetRoomProductRestrictionsDto,
  PmsRestrictionQueryDto,
  UpsertRestrictionDto,
} from "./restriction.dto";
import { RestrictionService } from "./restriction.service";

@Controller("restrictions")
export class RestrictionController {
  constructor(private readonly restrictionService: RestrictionService) {}

  @Get()
  async getRestrictions(@Query() query: GetRestrictionsDto) {
    return this.restrictionService.getRestrictions(query);
  }

  @Get("calendar")
  async getCalendar(@Query() query: CalendarRestrictionDto) {
    return this.restrictionService.getCalendar(query);
  }

  @Get("daily-rate-plans")
  async getRatePlanRestrictions(@Query() query: GetRatePlanRestrictionsDto) {
    return this.restrictionService.getRatePlanRestrictions(query);
  }

  @Get("daily-hotels")
  async getHotelRestrictions(@Query() query: GetHotelRestrictionsDto) {
    return this.restrictionService.getHotelRestrictions(query);
  }

  @Post("daily-room-products")
  async getRoomProductRestrictions(@Body() body: GetRoomProductRestrictionsDto) {
    return this.restrictionService.getRoomProductRestrictions(body);
  }

  @Get("hotel-settings")
  async getHotelSettings(@Query() query: { hotelId: string }) {
    return this.restrictionService.getHotelSettings(query);
  }

  @Post()
  async mergeRestrictions(@Body() body: CreateRestrictionDto) {
    return this.restrictionService.mergeRestrictions(body);
  }

  @Post("set")
  async upsertRestrictions(@Body() body: UpsertRestrictionDto) {
    return this.restrictionService.upsertRestrictions(body);
  }

  @Post("bulk")
  async bulkCreateRestriction(@Body() body: BulkRestrictionOperationDto) {
    return this.restrictionService.handleBulkRestrictionOperation(body);
  }

  @Post("pms/sync")
  syncPmsRestriction(@Body() body: PmsRestrictionQueryDto) {
    return this.restrictionService.syncPmsRestriction(body);
  }

  @Post("pms/push")
  pushPmsRestriction(@Body() body: CreatePmsRestrictionDto) {
    return this.restrictionService.handlePushPmsRestriction(body);
  }

  @Delete("bulk")
  async deleteBulkRestriction(@Body() body: BulkDeleteRestrictionDto) {
    return this.restrictionService.deleteBulkRestriction(body);
  }

  @Delete(":id")
  async deleteRestriction(@Param("id") id: string) {
    return this.restrictionService.deleteRestriction(id);
  }
}
