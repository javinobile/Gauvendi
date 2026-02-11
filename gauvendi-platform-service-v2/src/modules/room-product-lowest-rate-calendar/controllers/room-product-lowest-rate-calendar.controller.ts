import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoomProductLowestRateCalendarDto, RoomProductLowestRateCalendarFilterDto } from '../dto';
import { RoomProductLowestRateCalendarService } from '../services/room-product-lowest-rate-calendar.service';

@Controller('room-product-lowest-rate-calendar')
@ApiTags('room-product-lowest-rate-calendar')
export class RoomProductLowestRateCalendarController {
  constructor(
    private readonly roomProductLowestRateCalendarService: RoomProductLowestRateCalendarService
  ) {}

  @Get()
  async roomProductLowestRateCalendarList(
    @Query() filter: RoomProductLowestRateCalendarFilterDto
  ): Promise<{
    data: RoomProductLowestRateCalendarDto[];
    count: number;
    totalPage: number;
  }> {
    return await this.roomProductLowestRateCalendarService.roomProductLowestRateCalendarList(
      filter
    );
  }
}
