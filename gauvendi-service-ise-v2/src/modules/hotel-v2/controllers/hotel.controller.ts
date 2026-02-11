import { Controller, Get, Query } from '@nestjs/common';
import { HotelFilterDto, HotelResponseDto } from '../dtos/hotel.dto';
import { HotelService } from '../services/hotel.service';
import { ResponseData } from 'src/modules/core/dtos/common.dto';

@Controller('hotel')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Get('widget')
  getHotelWidget(@Query() filter: HotelFilterDto): Promise<ResponseData<HotelResponseDto>> {
    return this.hotelService.getHotelWidget(filter);
  }

  @Get()
  getHotel(@Query() filter: HotelFilterDto): Promise<HotelResponseDto> {
    return this.hotelService.getHotel(filter);
  }
}


