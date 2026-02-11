import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { HotelAgeCategoryQueryDto, UpdateHotelAgeCategoryDto, CreateHotelAgeCategoryDto } from "./hotel-age-categories.dto";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";

@Injectable()
export class HotelAgeCategoriesService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy
  ) {}

  getHotelAgeCategories(query: HotelAgeCategoryQueryDto) {
    return this.hotelClient.send({ cmd: "get_hotel_age_categories" }, query);
  }

  getHotelAgeCategory(id: string, hotelCode: string) {
    return this.hotelClient.send({ cmd: "get_hotel_age_category" }, { id, hotelCode });
  }

  createHotelAgeCategory(dto: CreateHotelAgeCategoryDto) {
    return this.hotelClient.send({ cmd: "create_hotel_age_category" }, dto);
  }

  updateHotelAgeCategory(id: string, dto: UpdateHotelAgeCategoryDto) {
    return this.hotelClient.send({ cmd: "update_hotel_age_category" }, { id, ...dto });
  }

  deleteHotelAgeCategory(id: string) {
    return this.hotelClient.send({ cmd: "delete_hotel_age_category" }, { id });
  }
}
