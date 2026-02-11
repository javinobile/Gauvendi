import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Res } from "@nestjs/common";
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
  SetRoomFeaturesDto,
  UpdateRoomUnitRetailFeaturesDto,
} from "./room-unit.dto";
import { RoomUnitService } from "./room-unit.service";
import { Public } from "@src/core/decorators/is-public.decorator";
import { map } from "rxjs";
import { Response } from "express";

@Controller("room-units")
export class RoomUnitController {
  constructor(private readonly roomUnitService: RoomUnitService) {}

  @Public()
  @Get("migrate-feature-string")
  migrateFeatureString() {
    return this.roomUnitService.migrateFeatureString();
  }

  @Post("regenerate-feature-string")
  regenerateFeatureString(@Body() body: RegenerateFeatureStringDto) {
    return this.roomUnitService.regenerateFeatureString(body);
  }

  @Get("")
  getRoomUnits(@Query() query: GetRoomUnitDto) {
    return this.roomUnitService.getRoomUnits(query);
  }

  @Post("")
  createRoomUnit(@Body() body: CreateRoomUnitDto) {
    return this.roomUnitService.createRoomUnit(body);
  }

  @Get("availability")
  getRoomUnitAvailability(@Query() query: GetRoomUnitAvailabilityDto) {
    return this.roomUnitService.getRoomUnitAvailability(query);
  }

  @Get("pms/room-units")
  getPmsRoomUnits(@Query("hotelId") hotelId: string) {
    return this.roomUnitService.getPmsRoomUnits(hotelId);
  }

  @Post("pms/room-units-maintenance")
  syncPmsRoomUnitsMaintenance(@Body() body: GetPmsRoomUnitsMaintenanceDto) {
    return this.roomUnitService.syncPmsRoomUnitsMaintenance(body);
  }

  @Post("room-units-maintenance")
  bulkUpdateRoomUnitMaintenance(@Body() body: RoomUnitMaintenanceDto) {
    return this.roomUnitService.bulkUpdateRoomUnitMaintenance(body);
  }

  @Post("bulk-update")
  bulkUpdateRoomUnit(@Body() body: BulkUpdateRoomUnitDto) {
    return this.roomUnitService.bulkUpdateRoomUnit(body);
  }

  @Delete("bulk")
  bulkDeleteRoomUnit(@Body() body: BulkDeleteRoomUnitDto) {
    return this.roomUnitService.bulkDeleteRoomUnit(body);
  }

  @Post("set-room-features")
  setRoomFeatures(@Body() body: SetRoomFeaturesDto) {
    return this.roomUnitService.setRoomFeatures(body);
  }

  @Post(":id/retail-features")
  updateRoomUnitRetailFeatures(@Param("id") roomUnitId: string, @Body() body: UpdateRoomUnitRetailFeaturesDto) {
    return this.roomUnitService.updateRoomUnitRetailFeatures(body.hotelId, roomUnitId, body.retailFeatures, body.keepOldRetailFeatures);
  }

  @Delete(":id")
  deleteRoomUnit(@Param("id") id: string) {
    return this.roomUnitService.deleteRoomUnit(id);
  }

  @Get("cpp-calendar-room-reservations")
  getCppCalendarRoomReservations(@Query() query: CppCalendarRoomReservationFilterDto) {
    return this.roomUnitService.getCppCalendarRoomReservations(query);
  }

  @Get("cpp-calendar-rooms")
  getCppCalendarRoom(@Query() query: CppCalendarRoomFilterDto) {
    return this.roomUnitService.getCppCalendarRoom(query);
  }

  @Post("sync-room-unit-inventory")
  syncRoomUnitInventory(@Body() body: RoomUnitInventoryDto, @Res() res: Response) {
    return this.roomUnitService.syncRoomUnitInventory(body).pipe(
      map((result) => {
        return res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Get("pms-room-unit-inventory")
  getPmsRoomUnitInventory(@Query() body: RoomUnitInventoryDto) {
    return this.roomUnitService.getPmsRoomUnitInventory(body);
  }

  @Post("delete-maintenances")
  deleteMaintenances(@Body() body: DeleteMaintenancesDto, @Res() res: Response) {
    return this.roomUnitService.deleteMaintenances(body).pipe(
      map((result) => {
        return res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("refresh-room-status")
  refreshRoomUnitAvailabilityStatus(@Body() body: RefreshRoomStatus) {
    return this.roomUnitService.refreshRoomUnitAvailabilityStatus(body);
  }

  @Public()
  @Get("migrate-maintenances")
  migrateMaintenances(@Res() res: Response) {
    return this.roomUnitService.migrateMaintenances().pipe(
      map((result) => {
        return res.status(HttpStatus.OK).send(result);
      })
    );
  }
}
