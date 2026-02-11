import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CreateFlexiChannel, FlexiChannelFilter, UpdateFlexiChannel, UpdateFlexiRatePlanMappings, UpdateFlexiRoomMappings } from "./flexi-channel.dto";

@Injectable()
export class FlexiChannelService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getFlexiChannelList(filter: FlexiChannelFilter) {
    return this.platformClient.send({ cmd: "get_flexi_channel" }, filter);
  }

  createFlexiChannelList(body: CreateFlexiChannel) {
    return this.platformClient.send({ cmd: "create_flexi_channel" }, body);
  }

  updateFlexiChannelList(body: UpdateFlexiChannel) {
    return this.platformClient.send({ cmd: "update_flexi_channel" }, body);
  }

  initializeFlexiChannel(hotelId: string) {
    return this.platformClient.send({ cmd: "initialize_flexi_channel" }, hotelId);
  }

  deleteFlexiChannelList(id: string) {
    return this.platformClient.send({ cmd: "delete_flexi_channel" }, id);
  }

  updateFlexiRoomMappings(body: UpdateFlexiRoomMappings) {
    return this.platformClient.send({ cmd: "update_flexi_room_mappings" }, body);
  }

  updateFlexiRatePlanMappings(body: UpdateFlexiRatePlanMappings) {
    return this.platformClient.send({ cmd: "update_flexi_rate_plan_mappings" }, body);
  }
}
