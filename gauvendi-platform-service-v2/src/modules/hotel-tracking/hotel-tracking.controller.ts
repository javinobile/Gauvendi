import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HotelTrackingService } from './hotel-tracking.service';
import {
  CreateOrUpdateHotelTrackingDto,
  DeleteHotelTrackingDto,
  HotelTrackingFilterDto,
} from './dtos/hotel-tracking.dto';

@Controller()
export class HotelTrackingController {
  constructor(private readonly hotelTrackingService: HotelTrackingService) {}

  @MessagePattern({ cmd: 'get_hotel_tracking_list' })
  async getHotelTrackingList(@Payload() payload: HotelTrackingFilterDto) {
    return this.hotelTrackingService.getHotelTrackingList(payload);
  }

  @MessagePattern({ cmd: 'create_or_update_hotel_tracking' })
  async createOrUpdateHotelTracking(
    @Payload() payload: CreateOrUpdateHotelTrackingDto,
  ) {
    return this.hotelTrackingService.createOrUpdateHotelTracking(payload);
  }

  @MessagePattern({ cmd: 'delete_hotel_tracking' })
  async deleteHotelTracking(@Payload() payload: DeleteHotelTrackingDto) {
    return this.hotelTrackingService.deleteHotelTracking(payload);
  }

  @MessagePattern({ cmd: 'get_meta_conversion_config' })
  async getMetaConversionConfig(@Payload() payload: { hotelCode: string }) {
    return this.hotelTrackingService.getMetaConversionConfig(payload.hotelCode);
  }
}
