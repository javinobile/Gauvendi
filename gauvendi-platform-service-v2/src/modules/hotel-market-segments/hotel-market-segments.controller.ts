import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import {
  HotelMarketSegmentDeleteDto,
  HotelMarketSegmentFilterDto,
  HotelMarketSegmentInputDto,
  SetMarketSegmentStatusDto
} from './dtos/hotel-market-segment.dto';
import { HotelMarketSegmentService } from './services/hotel-market-segment.service';

@Controller('hotel-market-segments')
export class HotelMarketSegmentsController {
  constructor(private readonly hotelMarketSegmentService: HotelMarketSegmentService) {}

  @MessagePattern({ cmd: CMD.MARKET_SEGMENT.GET_LIST })
  async getHotelMarketSegmentList(@Payload() filter: HotelMarketSegmentFilterDto) {
    return this.hotelMarketSegmentService.getHotelMarketSegments(filter);
  }

  @MessagePattern({ cmd: CMD.MARKET_SEGMENT.CREATE_OR_UPDATE })
  async createOrUpdateHotelMarketSegment(@Payload() input: HotelMarketSegmentInputDto) {
    return this.hotelMarketSegmentService.createOrUpdateHotelMarketSegment(input);
  }

  @MessagePattern({ cmd: CMD.MARKET_SEGMENT.DELETE })
  async deleteHotelMarketSegment(@Payload() body: HotelMarketSegmentDeleteDto) {
    return this.hotelMarketSegmentService.deleteHotelMarketSegment(body);
  }

  @MessagePattern({ cmd: CMD.MARKET_SEGMENT.SET_STATUS })
  async setMarketSegmentStatus(@Payload() payload: SetMarketSegmentStatusDto) {
    return this.hotelMarketSegmentService.setMarketSegmentStatus(payload);
  }
}
