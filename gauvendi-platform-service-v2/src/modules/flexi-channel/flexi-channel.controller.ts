import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateFlexiChannel,
  FlexiChannelFilter,
  UpdateFlexiChannel,
  UpdateFlexiRatePlanMappings,
  UpdateFlexiRoomMappings
} from './flexi-channel.dto';
import { FlexiChannelService } from './flexi-channel.service';

@Controller('flexi-channel')
export class FlexiChannelController {
  constructor(private readonly flexiChannelService: FlexiChannelService) {}

  @MessagePattern({ cmd: 'get_flexi_channel' })
  getFlexiChannelList(@Payload() filter: FlexiChannelFilter) {
    return this.flexiChannelService.getFlexiChannelList(filter);
  }

  @MessagePattern({ cmd: 'create_flexi_channel' })
  createFlexiChannelList(@Payload() body: CreateFlexiChannel) {
    return this.flexiChannelService.createFlexiChannelList(body);
  }

  @MessagePattern({ cmd: 'update_flexi_channel' })
  updateFlexiChannelList(@Payload() body: UpdateFlexiChannel) {
    return this.flexiChannelService.updateFlexiChannelList(body);
  }

  @MessagePattern({ cmd: 'delete_flexi_channel' })
  deleteFlexiChannelList(@Payload() id: string) {
    return this.flexiChannelService.deleteFlexiChannelList(id);
  }

  @MessagePattern({ cmd: 'update_flexi_room_mappings' })
  updateFlexiRoomMappings(@Payload() body: UpdateFlexiRoomMappings) {
    return this.flexiChannelService.updateFlexiRoomMappings(body);
  }

  @MessagePattern({ cmd: 'update_flexi_rate_plan_mappings' })
  updateFlexiRatePlanMappings(@Payload() body: UpdateFlexiRatePlanMappings) {
    return this.flexiChannelService.updateFlexiRatePlanMappings(body);
  }
}
