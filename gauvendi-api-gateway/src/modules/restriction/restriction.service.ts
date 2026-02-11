import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
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

@Injectable()
export class RestrictionService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getRestrictions(query: GetRestrictionsDto) {
    return this.platformClient.send({ cmd: "get_restrictions" }, query);
  }

  getCalendar(query: CalendarRestrictionDto) {
    return this.platformClient.send({ cmd: "get_calendar" }, query);
  }

  getRatePlanRestrictions(query: GetRatePlanRestrictionsDto) {
    return this.platformClient.send({ cmd: "get_rate_plan_restrictions" }, query);
  }

  getHotelRestrictions(query: GetHotelRestrictionsDto) {
    return this.platformClient.send({ cmd: "get_hotel_restrictions" }, query);
  }

  getRoomProductRestrictions(query: GetRoomProductRestrictionsDto) {
    return this.platformClient.send({ cmd: "get_room_product_restrictions" }, query);
  }

  getHotelSettings(query: { hotelId: string }) {
    return this.platformClient.send({ cmd: "get_hotel_restriction_setting" }, query.hotelId);
  }

  mergeRestrictions(body: CreateRestrictionDto) {
    return this.platformClient.send({ cmd: "merge_restrictions" }, body);
  }

  upsertRestrictions(body: UpsertRestrictionDto) {
    return this.platformClient.send({ cmd: "upsert_restrictions" }, body);
  }

  handleBulkRestrictionOperation(body: BulkRestrictionOperationDto) {
    return this.platformClient.send({ cmd: "bulk_restriction_operation" }, body);
  }

  syncPmsRestriction(body: PmsRestrictionQueryDto) {
    return this.platformClient.send({ cmd: "sync_pms_restriction" }, body);
  }

  handlePushPmsRestriction(body: CreatePmsRestrictionDto) {
    return this.platformClient.send({ cmd: "push_pms_restriction" }, body);
  }

  deleteRestriction(id: string) {
    return this.platformClient.send({ cmd: "delete_restriction" }, id);
  }


  deleteBulkRestriction(body: BulkDeleteRestrictionDto) {
    return this.platformClient.send({ cmd: "delete_bulk_restriction" }, body);
  }
}
