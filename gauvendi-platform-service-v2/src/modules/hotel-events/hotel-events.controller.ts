import { Controller } from '@nestjs/common';
import { HotelEventsService } from './hotel-events.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetHotelEventsDto, UpsertHotelEventDto } from './hotel-events.dto';

@Controller('hotel-events')
export class HotelEventsController {
  constructor(private readonly hotelEventsService: HotelEventsService) {}

  @MessagePattern({ cmd: 'migrate_hotel_events_translation' })  
  async migrateHotelEventsTranslation() {
    return this.hotelEventsService.migrateHotelEventsTranslation();
  }

  @MessagePattern({ cmd: 'get_hotel_events' })
  async getHotelEvents(@Payload() payload: GetHotelEventsDto) {
    return this.hotelEventsService.getHotelEvents(payload);
  }

  @MessagePattern({ cmd: 'upsert_hotel_event' })
  async upsertHotelEvent(@Payload() payload: UpsertHotelEventDto) {
    return this.hotelEventsService.upsertHotelEvent(payload);
  }

  @MessagePattern({ cmd: 'delete_hotel_event' })
  async deleteHotelEvent(@Payload() payload: { id: string }) {
    return this.hotelEventsService.deleteHotelEvent(payload);
  }

  @MessagePattern({ cmd: 'get_hotel_events_categories' })
  async getHotelEventsCategories() {
    return this.hotelEventsService.getHotelEventsCategories();
  }

  @MessagePattern({ cmd: 'get_hotel_events_labels' })
  async getHotelEventsLabels() {
    return this.hotelEventsService.getHotelEventsLabels();
  }

  @MessagePattern({ cmd: 'refresh_event_categories_image' })
  async refreshImageEventCategories() {
    return this.hotelEventsService.refreshImageEventCategories();
  }
}
