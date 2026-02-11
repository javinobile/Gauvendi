import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CreateFlexiChannel, FlexiChannelFilter, UpdateFlexiChannel, UpdateFlexiRatePlanMappings, UpdateFlexiRoomMappings } from "./flexi-channel.dto";
import { FlexiChannelService } from "./flexi-channel.service";

@Controller("flexi-channel")
export class FlexiChannelController {
  constructor(private readonly flexiChannelService: FlexiChannelService) {}

  @Get("")
  getFlexiChannelList(@Query() filter: FlexiChannelFilter) {
    return this.flexiChannelService.getFlexiChannelList(filter);
  }

  @Post()
  createFlexiChannelList(@Body() body: CreateFlexiChannel) {
    return this.flexiChannelService.createFlexiChannelList(body);
  }

  @Post('initialize_flexi_channel')
  initializeFlexiChannel(@Body() body: {hotelId: string}) {
    return this.flexiChannelService.initializeFlexiChannel(body.hotelId);
  }

  @Post(":id/room-mappings")
  updateFlexiRoomMappings(@Body() body: UpdateFlexiRoomMappings) {
    return this.flexiChannelService.updateFlexiRoomMappings(body);
  }

  @Post(":id/rate-plan-mappings")
  updateFlexiRatePlanMappings(@Body() body: UpdateFlexiRatePlanMappings) {
    return this.flexiChannelService.updateFlexiRatePlanMappings(body);
  }

  @Put(":id")
  updateFlexiChannelList(@Param("id") id: string, @Body() body: UpdateFlexiChannel) {
    return this.flexiChannelService.updateFlexiChannelList(body);
  }

  @Delete(":id")
  deleteFlexiChannelList(@Param("id") id: string) {
    return this.flexiChannelService.deleteFlexiChannelList(id);
  }
}
