import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { GetHotelEventsDto, UpdateHotelEventDto } from "./hotel-events.dto";

@Injectable()
export class HotelEventsService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy) {}

  async migrateTranslation() {
    return this.hotelClient.send({ cmd: "migrate_hotel_events_translation" }, {});
  }

  async getHotelEvents(query: GetHotelEventsDto) {
    return this.hotelClient.send({ cmd: "get_hotel_events" }, query);
  }

  async upsertHotelEvent(dto: UpdateHotelEventDto) {
    return this.hotelClient.send({ cmd: "upsert_hotel_event" }, dto);
  }

  async deleteHotelEvent(id: string) {
    return this.hotelClient.send({ cmd: "delete_hotel_event" }, { id });
  }

  async getHotelEventsCategories() {
    return this.hotelClient.send({ cmd: "get_hotel_events_categories" }, {});
  }

  async getHotelEventsLabels() {
    return this.hotelClient.send({ cmd: "get_hotel_events_labels" }, {});
  }
}
