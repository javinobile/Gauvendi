import { Body, Controller, Post } from '@nestjs/common';
import { CalendarDirectRestrictionQueryDto, CalendarQueryDto, CalendarRestrictionQueryDto, CalendarRoomProductQueryDto, CalendarRoomProductSellabilityQueryDto } from './calendar.dto';
import { CalendarService } from './calendar.service';

@Controller('calendars')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('availability')
  getAvailability(@Body() query: CalendarQueryDto) {
    return this.calendarService.getAvailability(query);
  }

  @Post('specific-room-products')
  getSpecificRoomProducts(@Body() query: CalendarRoomProductQueryDto) {
    return this.calendarService.getSpecificRoomProducts(query);
  }

  @Post('restriction')
  getRestriction(@Body() query: CalendarRestrictionQueryDto) {
    return this.calendarService.getRestriction(query);
  }

  @Post('direct-restriction')
  getDirectRestriction(@Body() query: CalendarDirectRestrictionQueryDto) {
    return this.calendarService.getDirectRestriction(query);
  }

  @Post('sellability')
  getSellability(@Body() query: CalendarRoomProductSellabilityQueryDto) {
    return this.calendarService.getSellabilityByChunks(query);
  }
}
