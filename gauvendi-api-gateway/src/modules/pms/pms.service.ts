import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { CreateMappingHotelDto, DeauthorizeConnectorDto, GetPmsConnectorListDto, GetPmsHotelListDto, GetPmsRoomListDto } from "./dtos/get-pms-connector-list.dto";
import { AuthorizeConnectorDto } from "./dtos/authorize-connector.dto";

@Injectable()
export class PmsService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getPmsConnectorList(query: GetPmsConnectorListDto) {
    return this.platformClient.send({ cmd: CMD.PMS.GET_PMS_CONNECTOR_LIST }, query);
  }
  
  getPmsRoomList(query: GetPmsRoomListDto) {
    return this.platformClient.send({ cmd: CMD.PMS.GET_PMS_ROOM_LIST }, query);
  }

  authorizeConnector(body: AuthorizeConnectorDto) {
    return this.platformClient.send({ cmd: CMD.PMS.AUTHORIZE_CONNECTOR }, body);
  }

  getPmsHotelList(body: GetPmsHotelListDto) {
    return this.platformClient.send({ cmd: CMD.PMS.GET_PMS_HOTEL_LIST }, body);
  }
  createMappingHotel(body: CreateMappingHotelDto) {
    return this.platformClient.send({ cmd: CMD.PMS.CREATE_MAPPING_HOTEL }, body);
  }
  deauthorizeConnector(body: DeauthorizeConnectorDto) {
    return this.platformClient.send({ cmd: CMD.PMS.DEAUTHORIZE_CONNECTOR }, body);
  }
}
