import { Body, Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  BulkDeleteRestrictionDto,
  BulkRestrictionOperationDto,
  CalendarRestrictionDto,
  CreatePmsRestrictionDto,
  CreateRestrictionDto,
  GetRatePlanRestrictionsDto,
  GetRestrictionsDto,
  GetRoomProductRestrictionsDto,
  PmsRestrictionQueryDto,
  UpsertRestrictionDto
} from './restriction.dto';
import { RestrictionService } from './restriction.service';
import { CRON_JOB_CMD } from '@src/core/constants/cmd.const';

@Controller('restrictions')
export class RestrictionController {
  private readonly logger = new Logger(RestrictionController.name);
  constructor(private readonly restrictionService: RestrictionService) {}

  @MessagePattern({ cmd: 'get_restrictions' })
  async getRestrictions(@Payload() query: GetRestrictionsDto) {
    return this.restrictionService.getRestrictions(query);
  }

  @MessagePattern({ cmd: 'get_rate_plan_restrictions' })
  async getRatePlanRestrictions(@Payload() query: GetRatePlanRestrictionsDto) {
    return this.restrictionService.getRatePlanRestrictions(query);
  }

  @MessagePattern({ cmd: 'get_hotel_restrictions' })
  async getHotelRestrictions(@Payload() query: GetRatePlanRestrictionsDto) {
    return this.restrictionService.getHotelRestrictions(query);
  }

  @MessagePattern({ cmd: 'get_room_product_restrictions' })
  async getRoomProductRestrictions(@Payload() query: GetRoomProductRestrictionsDto) {
    return this.restrictionService.getRoomProductRestrictions(query);
  }

  @MessagePattern({ cmd: 'get_restriction_calendar' })
  async getCalendar(@Payload() query: CalendarRestrictionDto) {
    return this.restrictionService.getCalendar(query);
  }

  @MessagePattern({ cmd: 'get_restriction_calendar_direct' })
  async getCalendarDirect(@Payload() query: CalendarRestrictionDto) {
    return this.restrictionService.getCalendar(query);
  }

  @MessagePattern({ cmd: 'merge_restrictions' })
  async mergeRestrictions(@Body() body: CreateRestrictionDto) {
    return this.restrictionService.mergeRestrictions(body);
  }

  @MessagePattern({ cmd: 'upsert_restrictions' })
  async upsertRestrictions(@Body() body: UpsertRestrictionDto) {
    return this.restrictionService.upsertRestrictions(body);
  }

  @MessagePattern({ cmd: 'bulk_create_restriction' })
  async bulkCreateRestriction(@Body() body: BulkRestrictionOperationDto) {
    return this.restrictionService.handleBulkRestrictionOperation(body);
  }

  @MessagePattern({ cmd: 'sync_pms_restriction' })
  syncPmsRestriction(@Body() body: PmsRestrictionQueryDto) {
    return this.restrictionService.syncPmsRestriction(body);
  }

  @MessagePattern({ cmd: 'push_pms_restriction' })
  pushPmsRestriction(@Body() body: CreatePmsRestrictionDto) {
    return this.restrictionService.handlePushPmsRestriction(body);
  }

  @MessagePattern({ cmd: 'delete_restriction' })
  async deleteRestriction(@Payload() id: string) {
    return this.restrictionService.deleteRestriction(id);
  }

  @MessagePattern({ cmd: 'delete_bulk_restriction' })
  async deleteBulkRestriction(@Payload() body: BulkDeleteRestrictionDto) {
    return this.restrictionService.deleteBulkRestriction(body);
  }

  @MessagePattern({ cmd: 'get_hotel_restriction_setting' })
  async getHotelRestrictionSetting(@Payload() hotelId: string) {
    return this.restrictionService.getHotelRestrictionSetting(hotelId);
  }

  @MessagePattern({ cmd: 'job_set_closing_hour' })
  async jobSetClosingHour() {
    return this.restrictionService.jobSetClosingHour();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_SET_CLOSING_HOUR })
  async jobSetClosingHourEvent() {
    this.logger.debug('Cron job: set closing hour event');
    return this.restrictionService.jobSetClosingHour();
  }

  @MessagePattern({ cmd: 'job_delete_duplicated_restrictions' })
  async jobDeleteDuplicatedRestrictions() {
    return this.restrictionService.jobDeleteDuplicatedRestrictions();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_DELETE_DUPLICATED_RESTRICTIONS })
  async jobDeleteDuplicatedRestrictionsEvent() {
    this.logger.debug('Cron job: delete duplicated restrictions event');
    return this.restrictionService.jobDeleteDuplicatedRestrictions();
  }
}
