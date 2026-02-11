import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { HotelMarketSegmentFilterDto, HotelMarketSegmentInputDto, SetMarketSegmentStatusDto } from "./hotel-market-segment.dto";

@Injectable()
export class HotelMarketSegmentService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getHotelMarketSegmentList(query: HotelMarketSegmentFilterDto) {
    return this.clientProxy.send({ cmd: CMD.MARKET_SEGMENT.GET_LIST }, query);
  }

  createOrUpdateHotelMarketSegment(body: HotelMarketSegmentInputDto) {
    return this.clientProxy.send({ cmd: CMD.MARKET_SEGMENT.CREATE_OR_UPDATE }, body);
  }

  deleteHotelMarketSegment(id: string) {
    return this.clientProxy.send({ cmd: CMD.MARKET_SEGMENT.DELETE }, {id});
  }

  setMarketSegmentStatus(body: SetMarketSegmentStatusDto) {
    return this.clientProxy.send({ cmd: CMD.MARKET_SEGMENT.SET_STATUS }, body);
  }
}
