import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
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

@Injectable()
export class RoomProductAvailabilityService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getRoomProductsAvailability(query: RoomProductListQueryDto) {
    return this.platformClient.send({ cmd: "get_room_products_availability" }, query);
  }

  getCalendar(body: CalendarRoomProductQueryDto) {
    return this.platformClient.send({ cmd: "get_room_products_calendar" }, body);
  }

  getCalendarSpecificRoomProduct(body: CalendarRoomProductAvailabilityQueryDto) {
    return this.platformClient.send({ cmd: "get_calendar_specific_room_product" }, body);
  }

  getSettingPmsRoomProductMapping(hotelId: string) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT_AVAILABILITY.GET_SETTING_PMS_ROOM_PRODUCT_MAPPING }, hotelId);
  }

  upsertRoomProductMappingPms(body: UpsertRoomProductMappingPmsDto[]) {
    return this.platformClient.send({ cmd: "upsert_room_product_mapping_pms" }, body);
  }

  deleteRoomProductMappingPms(id: string) {
    return this.platformClient.send({ cmd: "delete_room_product_mapping_pms" }, id);
  }

  syncRoomProductAvailabilityPms(body: SyncRoomProductAvailabilityPmsDto) {
    return this.platformClient.send({ cmd: "sync_room_product_availability_pms" }, body);
  }

  upsertRoomProductAvailability(body: UpsertRoomProductAvailabilityDto) {
    return this.platformClient.send({ cmd: "upsert_room_product_availability" }, body);
  }

  roomProductCheckAvailability(body: RoomProductAvailabilityDto) {
    return this.platformClient.send({ cmd: "room_product_check_availability" }, body);
  }

  roomProductReleaseAvailability(body: RoomProductReleaseAvailabilityDto) {
    return this.platformClient.send({ cmd: "room_product_release_availability" }, body);
  }

  processRoomUnitAvailabilityUpdate(body: ProcessRoomUnitAvailabilityUpdateDto) {
    return this.platformClient.send({ cmd: "process_room_unit_availability_update" }, body);
  }

  generateRoomProductAvailability(body: GenerateRoomProductAvailabilityDto) {
    return this.platformClient.send({ cmd: "generate_room_product_availability" }, body);
  }

  getRoomProductMappingPms(body: GetRoomProductMappingPmsDto) {
    return this.platformClient.send({ cmd: "get_room_product_mapping_pms" }, body);
  }

  getRelatedMrfc(body: GetRelatedMrfcDto) {
    return this.platformClient.send({ cmd: "get_related_mrfc" }, body);
  }

  getOverlappingRfcErfcForMrfc(body: GetOverlappingRfcErfcForMrfcDto) {
    return this.platformClient.send({ cmd: "get_overlapping_rfc_erfc_for_mrfc" }, body);
  }

  getRoomProductAvailability(body: RoomDailyAvailabilityFilter) {
    return this.platformClient.send({ cmd: CMD.ROOM_PRODUCT_AVAILABILITY.GET_DAILY_AVAILABILITY }, body);
  }
}
