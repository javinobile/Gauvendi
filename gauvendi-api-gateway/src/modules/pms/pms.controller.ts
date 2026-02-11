import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CreateMappingHotelDto, DeauthorizeConnectorDto, GetPmsConnectorListDto, GetPmsHotelListDto, GetPmsRoomListDto } from "./dtos/get-pms-connector-list.dto";
import { PmsService } from "./pms.service";
import { AuthorizeConnectorDto } from "./dtos/authorize-connector.dto";

@Controller("pms")
export class PmsController {
  constructor(private readonly pmsService: PmsService) {}

  @Get("connector-list")
  async getPmsConnectorList(@Query() query: GetPmsConnectorListDto) {
    return this.pmsService.getPmsConnectorList(query);
  }

  @Get("room-list")
  async getPmsRoomList(@Query() query: GetPmsRoomListDto) {
    return this.pmsService.getPmsRoomList(query);
  }

  @Post("authorize-connector")
  async authorizeConnector(@Body() body: AuthorizeConnectorDto) {
    return this.pmsService.authorizeConnector(body);
  }

  @Get("hotel-list")
  async getPmsHotelList(@Query() query: GetPmsHotelListDto) {
    return this.pmsService.getPmsHotelList(query);
  }

  @Post("create-mapping-hotel")
  async createMappingHotel(@Body() body: CreateMappingHotelDto) {
    return this.pmsService.createMappingHotel(body);
  }

  @Post("deauthorize-connector")
  async deauthorizeConnector(@Body() body: DeauthorizeConnectorDto) {
    return this.pmsService.deauthorizeConnector(body);
  }
}
