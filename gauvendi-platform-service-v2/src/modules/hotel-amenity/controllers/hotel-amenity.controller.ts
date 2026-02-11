import { Controller } from '@nestjs/common';
import { HotelAmenityService } from '../hotel-amentity.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from 'src/core/constants/cmd.const';
import { HotelAmenityInputDto } from '@src/modules/hotel/dtos/hotel-amenity-filter.dto';

@Controller('hotel-amenity')
export class HotelAmenityController {
  constructor(private readonly hotelAmenityService: HotelAmenityService) {}

  @MessagePattern({ cmd: CMD.HOTEL_AMENITY.GET_PMS_AMENITY_LIST })
  getPmsAmenityList(@Payload() payload: { hotelId: string }) {
    const { hotelId } = payload;
    return this.hotelAmenityService.getPmsAmenityList(hotelId);
  }

  @MessagePattern({ cmd: CMD.HOTEL_AMENITY.UPDATE_HOTEL_AMENITY_LIST })
  updateHotelAmenityList(@Payload() payload: HotelAmenityInputDto[]) {
    return this.hotelAmenityService.updateHotelAmenityList(payload);
  }
}
