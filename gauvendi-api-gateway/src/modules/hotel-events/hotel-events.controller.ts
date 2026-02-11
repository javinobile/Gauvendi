import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { GetHotelEventsDto, UpdateHotelEventDto } from "./hotel-events.dto";
import { HotelEventsService } from "./hotel-events.service";
import { Public } from "@src/core/decorators/is-public.decorator";

@Controller("hotel-events")
export class HotelEventsController {
  constructor(private readonly hotelEventsService: HotelEventsService) {}

  @Get()
  async getHotelEvents(@Query() query: GetHotelEventsDto) {
    return this.hotelEventsService.getHotelEvents(query);
  }

  @Get("migrate-translation")
  @Public()
  async migrateTranslation() {
    return this.hotelEventsService.migrateTranslation();
  }

  @Post()
  async upsertHotelEvent(@Body() dto: UpdateHotelEventDto) {
    return this.hotelEventsService.upsertHotelEvent(dto);
  }

  @Delete(":id")
  async deleteHotelEvent(@Param("id") id: string) {
    return this.hotelEventsService.deleteHotelEvent(id);
  }

  @Get("categories")
  async getHotelEventsCategories() {
    return this.hotelEventsService.getHotelEventsCategories();
  }

  @Get("labels")
  async getHotelEventsLabels() {
    return this.hotelEventsService.getHotelEventsLabels();
  }
}
