import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { HotelAgeCategoryQueryDto, UpdateHotelAgeCategoryDto, DeleteHotelAgeCategoryDto, CreateHotelAgeCategoryDto, GetHotelAgeCategoryDto } from "./hotel-age-categories.dto";
import { HotelAgeCategoriesService } from "./hotel-age-categories.service";

@Controller()
export class HotelAgeCategoriesController {
  constructor(private readonly hotelAgeCategoriesService: HotelAgeCategoriesService) {}

  @MessagePattern({ cmd: "get_hotel_age_categories" })
  getHotelAgeCategories(@Payload() query: HotelAgeCategoryQueryDto) {
    return this.hotelAgeCategoriesService.getHotelAgeCategories(query);
  }

  @MessagePattern({ cmd: "get_hotel_age_category" })
  getHotelAgeCategory(@Payload() dto: GetHotelAgeCategoryDto) {
    return this.hotelAgeCategoriesService.getHotelAgeCategory(dto);
  }

  @MessagePattern({ cmd: "create_hotel_age_category" })
  createHotelAgeCategory(@Payload() dto: CreateHotelAgeCategoryDto) {
    return this.hotelAgeCategoriesService.createHotelAgeCategory(dto);
  }

  @MessagePattern({ cmd: "update_hotel_age_category" })
  updateHotelAgeCategory(@Payload() dto: UpdateHotelAgeCategoryDto) {
    return this.hotelAgeCategoriesService.updateHotelAgeCategory(dto);
  }

  @MessagePattern({ cmd: "delete_hotel_age_category" })
  deleteHotelAgeCategory(@Payload() dto: DeleteHotelAgeCategoryDto) {
    return this.hotelAgeCategoriesService.deleteHotelAgeCategory(dto);
  }
}
