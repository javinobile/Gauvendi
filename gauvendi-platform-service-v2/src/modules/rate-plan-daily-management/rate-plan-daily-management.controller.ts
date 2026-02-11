import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RatePlanDailyManagementService } from './rate-plan-daily-management.service';
import { DailyOccupancyRateFilter } from './dto/daily-hotel-occupancy-rate-list.dto';

@Controller()
export class RatePlanDailyManagementController {
  constructor(private readonly ratePlanDailyManagementService: RatePlanDailyManagementService) { }

  @MessagePattern({ cmd: 'daily_hotel_occupancy_rate_list' })
  dailyHotelOccupancyRateList(@Payload() filter: DailyOccupancyRateFilter) {
    return this.ratePlanDailyManagementService.dailyHotelOccupancyRateList(filter);
  }
}
