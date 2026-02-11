import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { CppCalendarRoomReservationFilterDto } from "./dtos/cpp-calendar-room-reservation.dto";
import { CppCalendarRoomFilterDto } from "./dtos/cpp-calendar-room.dto";
import {
  BulkDeleteRoomUnitDto,
  BulkUpdateRoomUnitDto,
  CreateRoomUnitDto,
  DeleteMaintenancesDto,
  GetPmsRoomUnitsMaintenanceDto,
  GetRoomUnitAvailabilityDto,
  GetRoomUnitDto,
  RefreshRoomStatus,
  RegenerateFeatureStringDto,
  RoomUnitInventoryDto,
  RoomUnitMaintenanceDto,
  RoomUnitRetailFeatureDto,
  SetRoomFeaturesDto,
} from "./room-unit.dto";

@Injectable()
export class RoomUnitService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  migrateFeatureString() {
    return this.platformClient.send({ cmd: "migrate_feature_string" }, {});
  }

  getRoomUnits(query: GetRoomUnitDto) {
    return this.platformClient.send({ cmd: "get_room_units" }, query);
  }

  createRoomUnit(body: CreateRoomUnitDto) {
    return this.platformClient.send({ cmd: "create_room_unit" }, body);
  }

  getRoomUnitAvailability(query: GetRoomUnitAvailabilityDto) {
    return this.platformClient.send({ cmd: "get_room_unit_availability" }, query);
  }

  getPmsRoomUnits(hotelId: string) {
    return this.platformClient.send({ cmd: "get_pms_room_units" }, hotelId);
  }

  syncPmsRoomUnitsMaintenance(body: GetPmsRoomUnitsMaintenanceDto) {
    return this.platformClient.send({ cmd: "sync_pms_room_units_maintenance" }, body);
  }

  bulkUpdateRoomUnitMaintenance(body: RoomUnitMaintenanceDto) {
    return this.platformClient.send({ cmd: "bulk_update_room_unit_maintenance" }, body);
  }

  bulkUpdateRoomUnit(body: BulkUpdateRoomUnitDto) {
    return this.platformClient.send({ cmd: "bulk_update_room_unit" }, body);
  }

  bulkDeleteRoomUnit(body: BulkDeleteRoomUnitDto) {
    return this.platformClient.send({ cmd: "bulk_delete_room_unit" }, body);
  }

  setRoomFeatures(body: SetRoomFeaturesDto) {
    return this.platformClient.send({ cmd: "set_room_features" }, body);
  }

  updateRoomUnitRetailFeatures(hotelId: any, roomUnitId: string, retailFeatures: RoomUnitRetailFeatureDto[], keepOldRetailFeatures: boolean) {
    return this.platformClient.send({ cmd: "update_room_unit_retail_features" }, { hotelId, roomUnitId, retailFeatures, keepOldRetailFeatures });
  }

  deleteRoomUnit(id: string) {
    return this.platformClient.send({ cmd: "delete_room_unit" }, id);
  }

  getCppCalendarRoomReservations(query: CppCalendarRoomReservationFilterDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_UNIT.GET_CPP_CALENDAR_ROOM_RESERVATIONS }, query);
  }

  getCppCalendarRoom(query: CppCalendarRoomFilterDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_UNIT.GET_CPP_CALENDAR_ROOM }, query);
  }

  syncRoomUnitInventory(body: RoomUnitInventoryDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_UNIT.SYNC_ROOM_UNIT_INVENTORY }, body);
  }

  getPmsRoomUnitInventory(body: RoomUnitInventoryDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_UNIT.GET_PMS_ROOM_UNITS_INVENTORY }, body);
  }

  deleteMaintenances(body: DeleteMaintenancesDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_UNIT.DELETE_MAINTENANCES }, body);
  }

  migrateMaintenances() {
    return this.platformClient.send({ cmd: CMD.ROOM_UNIT.MIGRATE_MAINTENANCES }, {});
  }

  refreshRoomUnitAvailabilityStatus(body: RefreshRoomStatus) {
    return this.platformClient.send({ cmd: CMD.ROOM_UNIT.REFRESH_ROOM_UNIT_AVAILABILITY_STATUS }, body);
  }

  regenerateFeatureString(body: RegenerateFeatureStringDto) {
    return this.platformClient.send({ cmd: CMD.ROOM_UNIT.REGENERATE_FEATURE_STRING }, body);
  }
}
