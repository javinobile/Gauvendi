import { Controller, Get, Query } from '@nestjs/common';
import { HotelAmenityFilterDto, HotelAmenityResponseDto } from '../dtos/hotel-amenity.dto';
import { HotelAmenityService } from '../services/hotel-amenity.service';

@Controller('hotel-amenity')
export class HotelAmenityController {
  constructor(private readonly hotelAmenityService: HotelAmenityService) {}

  @Get('surcharge-amenities')
  async getSurchargeAmenities(
    @Query() filter: HotelAmenityFilterDto
  ): Promise<HotelAmenityResponseDto[]> {
    return await this.hotelAmenityService.getSurchargeAmenities(filter);
  }
}
