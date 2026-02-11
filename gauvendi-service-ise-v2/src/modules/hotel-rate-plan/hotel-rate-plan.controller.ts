import { Controller, Get, Query } from '@nestjs/common';
import { HotelRatePlanFilterDto } from './dtos/hotel-rate-plan-filter.dto';
import { RatePlanDto } from './dtos/rate-plan.dto';
import { HotelRatePlanService } from './services/hotel-rate-plan.service';

@Controller('hotel-rate-plan')
export class HotelRatePlanController {
  constructor(private readonly hotelRatePlanService: HotelRatePlanService) {}

  @Get('')
  async findAll(@Query() filter: HotelRatePlanFilterDto): Promise<RatePlanDto[]> {
    return this.hotelRatePlanService.findAll(filter);
  }
}
