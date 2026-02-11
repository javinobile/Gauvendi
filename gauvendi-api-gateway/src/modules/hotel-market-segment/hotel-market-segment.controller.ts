import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { HotelMarketSegmentFilterDto, HotelMarketSegmentInputDto, SetMarketSegmentStatusDto } from "./hotel-market-segment.dto";
import { HotelMarketSegmentService } from "./hotel-market-segment.service";

@Controller("hotel-market-segment")
export class HotelMarketSegmentController {
  constructor(private readonly hotelMarketSegmentService: HotelMarketSegmentService) {}

  @Get()
  getHotelMarketSegmentList(@Query() query: HotelMarketSegmentFilterDto) {
    return this.hotelMarketSegmentService.getHotelMarketSegmentList(query);
  }

  @Post("create")
  createHotelMarketSegment(@Body() body: HotelMarketSegmentInputDto) {
    return this.hotelMarketSegmentService.createOrUpdateHotelMarketSegment(body);
  }

  @Post("update")
  updateHotelMarketSegment(@Body() body: HotelMarketSegmentInputDto) {
    return this.hotelMarketSegmentService.createOrUpdateHotelMarketSegment(body);
  }

  @Delete(":id")
  deleteHotelMarketSegment(@Param("id") id: string) {
    return this.hotelMarketSegmentService.deleteHotelMarketSegment(id);
  }

  @Post("set-status")
  setMarketSegmentStatus(@Body() body: SetMarketSegmentStatusDto) {
    return this.hotelMarketSegmentService.setMarketSegmentStatus(body);
  }
}
