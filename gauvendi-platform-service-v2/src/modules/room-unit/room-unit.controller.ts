import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CMD, CRON_JOB_CMD } from '@src/core/constants/cmd.const';
import { CppCalendarRoomReservationFilterDto } from './dtos/cpp-calendar-room-reservation.dto';
import { CppCalendarRoomFilterDto } from './dtos/cpp-calendar-room.dto';
import { RoomUnitV2Service } from './room-unit-v2.service';
import {
  BulkDeleteRoomUnitDto,
  BulkUpdateRoomUnitDto,
  CreateRoomUnitDto,
  DeleteMaintenancesDto,
  GetPmsRoomUnitsMaintenanceDto,
  GetRoomUnitAvailabilityDto,
  GetRoomUnitDto,
  RefreshRoomStatus,
  RoomUnitMaintenanceDto,
  SetRoomFeaturesDto,
  UpdateRoomUnitRetailFeaturesDto
} from './room-unit.dto';
import { RoomUnitService } from './room-unit.service';

@Controller('room-units')
export class RoomUnitController {
  private readonly logger = new Logger(RoomUnitController.name);
  constructor(
    private readonly roomUnitService: RoomUnitService,
    private readonly roomUnitV2Service: RoomUnitV2Service
  ) {}

  @MessagePattern({ cmd: 'migrate_feature_string' })
  migrateFeatureString() {
    return this.roomUnitService.migrateFeatureString();
  }

  @MessagePattern({ cmd: CMD.ROOM_UNIT.MIGRATE_MAINTENANCES })
  migrateMaintenances() {
    return this.roomUnitService.migrateMaintenances();
  }

  @MessagePattern({ cmd: 'get_room_units' })
  getRoomUnits(@Payload() query: GetRoomUnitDto) {
    return this.roomUnitService.getRoomUnitsV2(query);
  }

  @MessagePattern({ cmd: 'create_room_unit' })
  createRoomUnit(@Payload() body: CreateRoomUnitDto) {
    return this.roomUnitService.createRoomUnit(body);
  }

  @MessagePattern({ cmd: 'get_room_unit_availability' })
  getRoomUnitAvailability(@Payload() query: GetRoomUnitAvailabilityDto) {
    return this.roomUnitService.getRoomUnitAvailability(query);
  }

  @MessagePattern({ cmd: 'get_pms_room_units' })
  getPmsRoomUnits(@Payload() hotelId: string) {
    return this.roomUnitService.getPmsRoomUnits(hotelId);
  }

  @MessagePattern({ cmd: 'sync_pms_room_units_maintenance' })
  syncPmsRoomUnitsMaintenance(@Payload() body: GetPmsRoomUnitsMaintenanceDto) {
    return this.roomUnitService.syncPmsRoomUnitsMaintenance(body);
  }

  @MessagePattern({ cmd: 'bulk_update_room_unit_maintenance' })
  bulkUpdateRoomUnitMaintenance(@Payload() body: RoomUnitMaintenanceDto) {
    return this.roomUnitService.bulkUpdateRoomUnitMaintenance(body);
  }

  @MessagePattern({ cmd: 'bulk_update_room_unit' })
  bulkUpdateRoomUnit(@Payload() body: BulkUpdateRoomUnitDto) {
    return this.roomUnitService.bulkUpdateRoomUnit(body);
  }

  @MessagePattern({ cmd: 'bulk_delete_room_unit' })
  bulkDeleteRoomUnit(@Payload() body: BulkDeleteRoomUnitDto) {
    return this.roomUnitService.bulkDeleteRoomUnit(body);
  }

  @MessagePattern({ cmd: 'set_room_features' })
  setRoomFeatures(@Payload() body: SetRoomFeaturesDto) {
    return this.roomUnitService.setRoomFeatures(body);
  }

  @MessagePattern({ cmd: 'update_room_unit_retail_features' })
  updateRoomUnitRetailFeatures(@Payload() body: UpdateRoomUnitRetailFeaturesDto) {
    return this.roomUnitService.updateRoomUnitRetailFeatures(
      body.hotelId,
      body.roomUnitId,
      body.retailFeatures,
      body.keepOldRetailFeatures
    );
  }

  @MessagePattern({ cmd: 'delete_room_unit' })
  deleteRoomUnit(@Payload() id: string) {
    return this.roomUnitService.deleteRoomUnit(id);
  }

  @MessagePattern({ cmd: CMD.ROOM_UNIT.GET_CPP_CALENDAR_ROOM_RESERVATIONS })
  getCppCalendarRoomReservations(@Payload() body: CppCalendarRoomReservationFilterDto) {
    return this.roomUnitV2Service.getCppCalendarRoomReservations(body);
  }

  @MessagePattern({ cmd: CMD.ROOM_UNIT.GET_CPP_CALENDAR_ROOM })
  getCppCalendarRoom(@Payload() body: CppCalendarRoomFilterDto) {
    return this.roomUnitV2Service.cppCalendarRoom(body);
  }

  @MessagePattern({ cmd: CMD.ROOM_UNIT.SYNC_ROOM_UNIT_INVENTORY })
  syncRoomUnitInventory(@Payload() body: { hotelId: string }) {
    return this.roomUnitV2Service.syncRoomUnitInventory(body.hotelId);
  }

  @MessagePattern({ cmd: CMD.ROOM_UNIT.GET_PMS_ROOM_UNITS_INVENTORY })
  getPmsRoomUnitsInventory(@Payload() body: { hotelId: string }) {
    return this.roomUnitV2Service.getPmsRoomUnitsInventory(body.hotelId);
  }

  @MessagePattern({ cmd: CMD.ROOM_UNIT.DELETE_MAINTENANCES })
  deleteMaintenances(@Payload() body: DeleteMaintenancesDto) {
    return this.roomUnitService.deleteMaintenances(body);
  }

  @MessagePattern({ cmd: CMD.CRON_JOB.JOB_PULL_MAINTENANCE_PMS })
  pullMaintenancePms() {
    return this.roomUnitService.pullMaintenancePms();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_PULL_MAINTENANCE_PMS })
  pullMaintenancePmsEvent() {
    this.logger.debug('Cron job: pull maintenance pms event');
    return this.roomUnitService.pullMaintenancePms();
  }

  @MessagePattern({ cmd: CMD.ROOM_UNIT.REFRESH_ROOM_UNIT_AVAILABILITY_STATUS })
  refreshRoomUnitAvailabilityStatus(@Payload() body: RefreshRoomStatus) {
    return this.roomUnitService.refreshRoomUnitAvailabilityStatus(body);
  }

  @MessagePattern({ cmd: 'job_pull_pms_availability' })
  jobPullPmsAvailability() {
    return this.roomUnitService.jobPullPmsAvailability();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_PULL_PMS_AVAILABILITY })
  jobPullPmsAvailabilityEvent() {
    this.logger.debug('Cron job: pull pms availability event');
    return this.roomUnitService.jobPullPmsAvailability();
  }

  @MessagePattern({ cmd: CMD.ROOM_UNIT.REGENERATE_FEATURE_STRING })
  regenerateFeatureString(
    @Payload()
    body: {
      hotelId: string;
      isGenerateRoomUnit: boolean;
      isGenerateRoomProductRFC: boolean;
      isGenerateRoomProductMRFC: boolean;
    }
  ) {
    return this.roomUnitService.regenerateFeatureString(body);
  }
}
