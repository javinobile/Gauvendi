import { Controller, Get, Query } from '@nestjs/common';
import { AvailableAmenityDto } from './room-product-hotel-extra-list.dto';
import { RoomProductHotelExtraListService } from './room-product-hotel-extra-list.service';

@Controller('room-product-hotel-extra-list')
export class RoomProductHotelExtraListController {
  constructor(
    private readonly roomProductHotelExtraListService: RoomProductHotelExtraListService
  ) {}

  @Get('available-amenity')
  async getAvailableAmenity(@Query() query: AvailableAmenityDto) {
    return this.roomProductHotelExtraListService.getAvailableAmenityV2(query);
  }
}
