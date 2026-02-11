import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { RoomProductAvailabilityListQueryDto } from '../room-product/room-product.dto';
import { RoomDailyAvailabilityFilter } from './dtos/room-product-availability-daily.dto';
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
  UpsertRoomProductMappingPmsDto
} from './room-product-availability.dto';
import { RoomProductAvailabilityService } from './room-product-availability.service';

@Controller('room-product-availability')
export class RoomProductAvailabilityController {
  constructor(private readonly roomProductAvailabilityService: RoomProductAvailabilityService) {}

  @MessagePattern({ cmd: 'get_room_products_availability' })
  getRoomProductsAvailability(@Payload() body: RoomProductAvailabilityListQueryDto) {
    return this.roomProductAvailabilityService.getRoomProductsAvailability(body);
  }

  @MessagePattern({ cmd: 'get_room_products_calendar' })
  getAvailabilityCalendar(@Payload() body: CalendarRoomProductQueryDto) {
    return this.roomProductAvailabilityService.getAvailabilityCalendar(body);
  }

  @MessagePattern({ cmd: 'get_calendar_specific_room_product' })
  getCalendarSpecificRoomProduct(@Payload() body: CalendarRoomProductAvailabilityQueryDto) {
    return this.roomProductAvailabilityService.getCalendarSpecificRoomProduct(body);
  }

  @MessagePattern({ cmd: 'upsert_room_product_mapping_pms' })
  upsertRoomProductMappingPms(@Payload() body: UpsertRoomProductMappingPmsDto[]) {
    return this.roomProductAvailabilityService.upsertRoomProductMappingPms(body);
  }

  @MessagePattern({ cmd: 'delete_room_product_mapping_pms' })
  deleteRoomProductMappingPms(@Payload() id: string) {
    return this.roomProductAvailabilityService.deleteRoomProductMappingPms(id);
  }

  @MessagePattern({ cmd: 'sync_room_product_availability_pms' })
  syncRoomProductAvailabilityPms(@Payload() body: SyncRoomProductAvailabilityPmsDto) {
    return this.roomProductAvailabilityService.syncRoomProductAvailabilityPms(body);
  }

  @MessagePattern({ cmd: 'upsert_room_product_availability' })
  upsertRoomProductAvailability(@Payload() body: UpsertRoomProductAvailabilityDto) {
    return this.roomProductAvailabilityService.upsertRoomProductAvailability(body);
  }

  @MessagePattern({ cmd: 'room_product_check_availability' })
  roomProductCheckAvailability(@Payload() body: RoomProductAvailabilityDto) {
    return this.roomProductAvailabilityService.roomProductCheckAvailability(body);
  }

  @MessagePattern({ cmd: 'room_product_check_availability_proposal' })
  roomProductCheckAvailabilityProposal(@Payload() body: RoomProductAvailabilityDto) {
    return this.roomProductAvailabilityService.roomProductCheckAvailabilityProposal(body);
  }

  @MessagePattern({ cmd: 'get_overlapping_rfc_erfc_for_mrfc' })
  getOverlappingRfcErfcForMrfc(@Payload() query: GetOverlappingRfcErfcForMrfcDto) {
    return this.roomProductAvailabilityService.getOverlappingRfcErfcForMrfc(query);
  }

  // Unassigned room unit
  @MessagePattern({ cmd: 'room_product_release_availability' })
  roomProductReleaseAvailability(@Payload() body: RoomProductReleaseAvailabilityDto) {
    return this.roomProductAvailabilityService.roomProductReleaseAvailability(body);
  }

  // Assigned room unit
  @MessagePattern({ cmd: 'process_room_unit_availability_update' })
  processRoomUnitAvailabilityUpdate(@Payload() body: ProcessRoomUnitAvailabilityUpdateDto) {
    return this.roomProductAvailabilityService.processRoomUnitAvailabilityUpdate(
      body,
      'RoomProductAvailabilityController'
    );
  }

  @MessagePattern({ cmd: 'generate_room_product_availability' })
  generateRoomProductAvailability(@Payload() body: GenerateRoomProductAvailabilityDto) {
    return this.roomProductAvailabilityService.generateRoomProductAvailability(body);
  }

  @MessagePattern({ cmd: 'get_room_product_mapping_pms' })
  getRoomProductMappingPms(@Payload() body: GetRoomProductMappingPmsDto) {
    return this.roomProductAvailabilityService.getRoomProductMappingPms(body);
  }

  @MessagePattern({ cmd: 'get_related_mrfc' })
  getRelatedMrfc(@Payload() query: GetRelatedMrfcDto) {
    return this.roomProductAvailabilityService.getRelatedMrfc(query);
  }

  @MessagePattern({ cmd: CMD.ROOM_PRODUCT_AVAILABILITY.GET_DAILY_AVAILABILITY })
  getRoomProductDailyAvailability(@Payload() body: RoomDailyAvailabilityFilter) {
    return this.roomProductAvailabilityService.getRoomProductDailyAvailability(body);
  }

  @MessagePattern({ cmd: CMD.ROOM_PRODUCT_AVAILABILITY.GET_SETTING_PMS_ROOM_PRODUCT_MAPPING })
  getRoomProductAvailabilityPms(@Payload() hotelId: string) {
    return this.roomProductAvailabilityService.getSettingPmsRoomProductMapping(hotelId);
  }
}
