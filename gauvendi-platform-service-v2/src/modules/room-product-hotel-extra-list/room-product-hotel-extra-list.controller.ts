import { Controller, Get, Query } from '@nestjs/common';
import { RoomProductHotelExtraListService } from './room-product-hotel-extra-list.service';
import { AvailableAmenityDto } from './room-product-hotel-extra-list.dto';

@Controller('room-product-hotel-extra-list')
export class RoomProductHotelExtraListController {
  constructor(
    private readonly roomProductHotelExtraListService: RoomProductHotelExtraListService
  ) {}

  @Get('available-amenity')
  async getAvailableAmenity(@Query() query: AvailableAmenityDto) {
    return this.roomProductHotelExtraListService.getAvailableAmenity(query);
  }
}
